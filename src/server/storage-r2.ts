import 'server-only'

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2'
import { ActionError } from '@/server/errors'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/**
 * Procesa y sube una foto de mascota a Cloudflare R2.
 * Port de uploadPetPhoto (functions/src/index.ts): valida tipo/tamaño,
 * redimensiona a 800x800 y convierte a webp 80% antes de subir.
 */
export async function uploadPetPhotoToR2(petId: string, file: Buffer, mimeType: string): Promise<{ url: string }> {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ActionError('invalid-argument', 'Formato de imagen inválido. Usa JPEG, PNG o WEBP')
  }

  if (file.length > MAX_UPLOAD_BYTES) {
    throw new ActionError('invalid-argument', 'La imagen no puede superar los 5MB')
  }

  let optimizedBuffer: Buffer
  try {
    optimizedBuffer = await sharp(file)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
  } catch {
    throw new ActionError('invalid-argument', 'No se pudo procesar la imagen. Prueba con otra foto (JPEG, PNG o WEBP válidos).')
  }

  const key = `pet-photos/${petId}/${crypto.randomUUID()}.webp`

  await r2Client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: optimizedBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )

  return { url: `${R2_PUBLIC_URL}/${key}` }
}

/** Extrae la key del objeto en R2 a partir de su URL pública. */
function extractKeyFromUrl(url: string): string | null {
  if (!R2_PUBLIC_URL || !url.startsWith(`${R2_PUBLIC_URL}/`)) return null
  return url.slice(R2_PUBLIC_URL.length + 1)
}

/** Elimina una foto de mascota de R2 a partir de su URL pública. No falla si la URL no pertenece a R2. */
export async function deletePetPhotoFromR2(url: string): Promise<void> {
  const key = extractKeyFromUrl(url)
  if (!key) return

  await r2Client().send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }),
  )
}
