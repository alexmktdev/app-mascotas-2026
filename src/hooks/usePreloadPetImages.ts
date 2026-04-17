/**
 * Preloading de imágenes de mascotas.
 * Resuelve URLs de Firebase Storage en paralelo, las cachea
 * y dispara la descarga real en el navegador para que cuando
 * <img> se renderice, los bytes ya estén en HTTP cache.
 */

import { useEffect } from 'react'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '@/lib/firebase'

const memoryCache = new Map<string, string>()

export function getCachedUrl(key: string): string | null {
  if (memoryCache.has(key)) return memoryCache.get(key)!
  try {
    const stored = sessionStorage.getItem(`img:${key}`)
    if (stored) {
      memoryCache.set(key, stored)
      return stored
    }
  } catch { /* ignore */ }
  return null
}

export function setCachedUrl(key: string, url: string): void {
  memoryCache.set(key, url)
  try {
    sessionStorage.setItem(`img:${key}`, url)
  } catch { /* ignore */ }
}

function triggerBrowserPreload(url: string): void {
  if (typeof document === 'undefined') return

  const existing = document.querySelector(`link[href="${CSS.escape(url)}"]`)
  if (existing) return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = url
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)

  setTimeout(() => link.remove(), 30_000)
}

export async function preloadPetImage(key: string): Promise<string> {
  const trimmedKey = key.trim()
  if (!trimmedKey) throw new Error('Empty key')

  const cached = getCachedUrl(trimmedKey)
  if (cached) {
    triggerBrowserPreload(cached)
    return cached
  }

  let url: string
  if (trimmedKey.startsWith('https://firebasestorage.googleapis.com')) {
    url = trimmedKey
  } else {
    const storageRef = ref(storage, trimmedKey)
    url = await getDownloadURL(storageRef)
  }

  setCachedUrl(trimmedKey, url)
  triggerBrowserPreload(url)
  return url
}

export function usePreloadPetImages(photoRefs: string[]) {
  useEffect(() => {
    if (!photoRefs || photoRefs.length === 0) return

    const uniqueKeys = [...new Set(photoRefs.filter(Boolean))]

    Promise.all(uniqueKeys.map((key) => preloadPetImage(key).catch(() => null)))
  }, [photoRefs])
}
