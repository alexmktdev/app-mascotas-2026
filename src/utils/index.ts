/**
 * Helpers puros — sin efectos secundarios.
 */

import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { PET_PHOTOS_BUCKET } from '@/constants'

// ──────────────────────────────────────────────
// Formato de fechas
// ──────────────────────────────────────────────

/** Formato relativo: "hace 3 días" */
export function formatRelativeDate(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es })
}

/** Formato legible: "12 abr 2026" */
export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM yyyy', { locale: es })
}

/** Formato completo: "12 de abril de 2026, 14:30" */
export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
}

// ──────────────────────────────────────────────
// Edad de mascotas
// ──────────────────────────────────────────────

/** Convierte meses a texto legible: "2 años y 3 meses" */
export function formatAge(months: number): string {
  if (months < 1) return 'Menos de 1 mes'
  if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  const yearStr = `${years} ${years === 1 ? 'año' : 'años'}`
  if (remainingMonths === 0) return yearStr
  return `${yearStr} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`
}

// ──────────────────────────────────────────────
// URLs de Google Drive
// ──────────────────────────────────────────────

const DRIVE_FILE_ID_REGEX = /^[a-zA-Z0-9_-]+$/

/** GIF 1×1 transparente: sin foto, error de carga o id Drive inválido. */
export const PET_IMAGE_FALLBACK =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/** Extrae el fileId de una URL de Google Drive (o devuelve el id si ya viene solo). */
export function extractDriveFileId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  if (DRIVE_FILE_ID_REGEX.test(trimmed)) return trimmed

  const dPath = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (dPath?.[1]) return dPath[1]

  const idParam = trimmed.match(/[?&#]id=([a-zA-Z0-9_-]+)/)
  if (idParam?.[1]) return idParam[1]

  return null
}

/**
 * Construye URL de thumbnail de Drive.
 * Si recibe una URL completa, primero extrae el id (nunca pega la URL entera en ?id=).
 */
export function buildDriveImageUrl(fileIdOrUrl: string, size: 'card' | 'detail' = 'card'): string {
  const id = extractDriveFileId(fileIdOrUrl)
  if (!id) return PET_IMAGE_FALLBACK

  const sz = size === 'card' ? 'w400' : 'w800'
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=${sz}`
}

/** Valida si el texto parece un enlace o id de archivo de Drive reconocible */
export function isValidDriveUrl(url: string): boolean {
  return extractDriveFileId(url) !== null
}

/** Enlaces blob:/data: solo viven en el navegador; no deben persistirse en `photo_urls`. */
export function isEphemeralImageRef(ref: string): boolean {
  const t = ref.trim().toLowerCase()
  return t.startsWith('blob:') || t.startsWith('data:')
}

/** URL pública del bucket de fotos de mascotas (mismo proyecto Supabase). */
export function isPetStoragePublicUrl(url: string): boolean {
  const u = url.trim().toLowerCase()
  if (!/^https?:\/\//i.test(url.trim())) return false
  const b = PET_PHOTOS_BUCKET.toLowerCase()
  return u.includes(`/object/public/${b}/`)
}

/**
 * Src para <img>: URLs de Storage tal cual; referencias antiguas de Drive vía thumbnail.
 */
export function resolvePetPhotoSrc(ref: string, size: 'card' | 'detail' = 'card'): string {
  const t = ref.trim()
  if (!t) return PET_IMAGE_FALLBACK
  if (isEphemeralImageRef(t)) return t
  if (isPetStoragePublicUrl(t)) return t
  return buildDriveImageUrl(t, size)
}

// ──────────────────────────────────────────────
// Logger seguro (solo en development)
// ──────────────────────────────────────────────

export const logger = {
  log: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.log(...args)
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.warn(...args)
  },
  error: (...args: unknown[]) => {
    // Los errores sí se loggean en producción para debugging
    console.error(...args)
  },
}

// ──────────────────────────────────────────────
// Sanitización
// ──────────────────────────────────────────────

/** Sanitiza input de búsqueda: remueve caracteres peligrosos */
export function sanitizeSearchInput(input: string): string {
  return input.replace(/[%_\\]/g, '').trim().slice(0, 100)
}

// ──────────────────────────────────────────────
// Debounce
// ──────────────────────────────────────────────

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }
}
