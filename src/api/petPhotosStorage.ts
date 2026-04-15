/**
 * Subida de fotos de mascotas a Supabase Storage (bucket pet-photos).
 * Flujo simple: solo JPEG/PNG, archivo tal cual (sin recompresión en cliente).
 */

import { supabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/withTimeout'
import {
  PET_PHOTOS_BUCKET,
  PET_PHOTO_MAX_BYTES,
  PET_PHOTO_MAX_SIZE_LABEL_ES,
  PET_PHOTO_MIME_TYPES,
} from '@/constants'
import { isEphemeralImageRef } from '@/utils'

const ALLOWED = new Set<string>(PET_PHOTO_MIME_TYPES)

/** Ruta dentro del bucket desde URL pública o firmada (insensible a mayúsculas en el bucket). */
export function extractPetPhotoStoragePath(storedUrl: string): string | null {
  if (isEphemeralImageRef(storedUrl)) return null
  const escaped = PET_PHOTOS_BUCKET.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`/object/(?:public|sign)/${escaped}/(.+?)(?:\\?|$)`, 'i')
  const m = storedUrl.match(re)
  if (!m?.[1]) return null
  try {
    return decodeURIComponent(m[1])
  } catch {
    return m[1]
  }
}

const signedUrlCache = new Map<string, { url: string; exp: number }>()

/** URL firmada (1 h); reutiliza caché ~50 min. Útil si la URL pública falla por RLS. */
export async function getPetPhotoSignedUrl(storagePath: string): Promise<string | null> {
  const now = Date.now()
  const hit = signedUrlCache.get(storagePath)
  if (hit && hit.exp > now) return hit.url

  const { data, error } = await supabase.storage
    .from(PET_PHOTOS_BUCKET)
    .createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) return null
  signedUrlCache.set(storagePath, { url: data.signedUrl, exp: now + 50 * 60 * 1000 })
  return data.signedUrl
}

/** Pre-genera URLs firmadas en lote para evitar el problema N+1 en listas. */
export async function primeSignedUrlsCache(storagePaths: string[]): Promise<void> {
  const now = Date.now()
  const needed = storagePaths.filter((p) => {
    const hit = signedUrlCache.get(p)
    return !hit || hit.exp <= now
  })

  if (needed.length === 0) return

  const { data, error } = await supabase.storage.from(PET_PHOTOS_BUCKET).createSignedUrls(needed, 3600)

  if (error || !data) return

  for (const item of data) {
    if (item.error || !item.signedUrl || !item.path) continue
    signedUrlCache.set(item.path, { url: item.signedUrl, exp: now + 50 * 60 * 1000 })
  }
}

function extensionForMime(mime: string): 'jpg' | 'png' {
  return mime === 'image/png' ? 'png' : 'jpg'
}

export async function uploadPetPhoto(userId: string, file: File): Promise<string> {
  if (file.size > PET_PHOTO_MAX_BYTES) {
    throw new Error(`Cada imagen puede pesar como máximo ${PET_PHOTO_MAX_SIZE_LABEL_ES}`)
  }
  if (!ALLOWED.has(file.type)) {
    throw new Error('Solo se permiten fotos JPEG o PNG')
  }

  const ext = extensionForMime(file.type)
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const UPLOAD_ATTEMPT_MS = 45_000
  const MAX_ATTEMPTS = 2

  let lastError: unknown = null
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    console.log('[Storage] Intentando subir foto', { path, fileSize: file.size, mimeType: file.type, attempt })
    try {
      await withTimeout(
        (async () => {
          const { error } = await supabase.storage.from(PET_PHOTOS_BUCKET).upload(path, file, {
            contentType: file.type,
            upsert: false,
            cacheControl: '31536000',
          })
          if (error) throw error
        })(),
        UPLOAD_ATTEMPT_MS,
        `Tiempo de espera al subir la foto (intento ${attempt}/${MAX_ATTEMPTS}).`,
      )
      console.log('[Storage] Resultado intento', { attempt, error: null, success: true })
      lastError = null
      break
    } catch (err) {
      console.log('[Storage] Resultado intento', { attempt, error: err, success: false })
      lastError = err
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    }
  }

  if (lastError) {
    const candidate = lastError as { message?: string; details?: string; hint?: string; name?: string; code?: string }
    console.error('[Storage] Error upload fotos:', {
      message: candidate?.message,
      details: candidate?.details,
      hint: candidate?.hint,
      code: candidate?.code,
      name: candidate?.name,
    })
    const msg =
      candidate?.message ||
      candidate?.details ||
      candidate?.hint ||
      candidate?.name ||
      `No se pudo subir la foto (máx. ${PET_PHOTO_MAX_SIZE_LABEL_ES}).`
    throw new Error(msg)
  }

  const { data } = supabase.storage.from(PET_PHOTOS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** Elimina físicamente las imágenes del Storage para no dejar archivos huérfanos. */
export async function deletePetPhotos(urls: string[]): Promise<void> {
  if (!urls.length) return

  const paths = urls
    .map((u) => extractPetPhotoStoragePath(u))
    .filter((p): p is string => p !== null)

  if (paths.length === 0) return

  const { error } = await supabase.storage.from(PET_PHOTOS_BUCKET).remove(paths)
  if (error) {
    console.warn('[Storage] Error al eliminar fotos:', error.message)
  }
}
