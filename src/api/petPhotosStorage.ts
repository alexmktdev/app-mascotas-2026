/**
 * Utilidades para URLs de fotos en Firebase Storage (bucket pet-photos).
 * Usado en tests y donde haga falta extraer el path del objeto.
 */

/**
 * Extrae el path del objeto en Storage desde una URL pública de Firebase
 * (`firebasestorage.googleapis.com/.../o/...`).
 */
export function extractPetPhotoStoragePath(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('firebasestorage.googleapis.com')) return null
    const pathMatch = u.pathname.match(/\/o\/(.+?)(?:\?|$)/)
    if (!pathMatch?.[1]) return null
    const decoded = decodeURIComponent(pathMatch[1])
    if (!decoded.startsWith('pet-photos/')) return null
    return decoded
  } catch {
    return null
  }
}
