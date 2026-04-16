/**
 * Preloading de imágenes de mascotas.
 * Resuelve todas las URLs de Firebase Storage en paralelo
 * y las cachea en sessionStorage para que PetPhotoImage las use instantáneamente.
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

export async function preloadPetImage(key: string): Promise<string> {
  const trimmedKey = key.trim()
  if (!trimmedKey) throw new Error('Empty key')

  const cached = getCachedUrl(trimmedKey)
  if (cached) return cached

  let url: string
  if (trimmedKey.startsWith('https://firebasestorage.googleapis.com')) {
    url = trimmedKey
  } else {
    const storageRef = ref(storage, trimmedKey)
    url = await getDownloadURL(storageRef)
  }

  setCachedUrl(trimmedKey, url)
  return url
}

export function usePreloadPetImages(photoRefs: string[]) {
  useEffect(() => {
    if (!photoRefs || photoRefs.length === 0) return

    const uniqueKeys = [...new Set(photoRefs.filter(Boolean))]

    Promise.all(uniqueKeys.map((key) => preloadPetImage(key).catch(() => null)))
  }, [photoRefs])
}
