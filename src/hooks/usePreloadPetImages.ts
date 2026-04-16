/**
 * Preloading de imágenes de mascotas.
 * Resuelve todas las URLs de Firebase Storage en paralelo,
 * descarga las imágenes como blobs y las cachea en memoria
 * para que PetPhotoImage las use instantáneamente.
 */

import { useEffect } from 'react'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '@/lib/firebase'

const memoryCache = new Map<string, string>()
const blobCache = new Map<string, string>()

export function getCachedUrl(key: string): string | null {
  const trimmedKey = key.trim()

  if (blobCache.has(trimmedKey)) return blobCache.get(trimmedKey)!
  if (memoryCache.has(trimmedKey)) return memoryCache.get(trimmedKey)!

  try {
    const stored = sessionStorage.getItem(`img:${trimmedKey}`)
    if (stored) {
      memoryCache.set(trimmedKey, stored)
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

function getBlobUrl(key: string): string | null {
  return blobCache.get(key) ?? null
}

async function fetchImageAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
  return response.blob()
}

export async function preloadPetImage(key: string): Promise<string> {
  const trimmedKey = key.trim()
  if (!trimmedKey) throw new Error('Empty key')

  const existingBlob = getBlobUrl(trimmedKey)
  if (existingBlob) return existingBlob

  const cached = getCachedUrl(trimmedKey)
  if (cached) {
    const blob = await fetchImageAsBlob(cached)
    const blobUrl = URL.createObjectURL(blob)
    blobCache.set(trimmedKey, blobUrl)
    return blobUrl
  }

  let url: string
  if (trimmedKey.startsWith('https://firebasestorage.googleapis.com')) {
    url = trimmedKey
  } else {
    const storageRef = ref(storage, trimmedKey)
    url = await getDownloadURL(storageRef)
  }

  setCachedUrl(trimmedKey, url)

  const blob = await fetchImageAsBlob(url)
  const blobUrl = URL.createObjectURL(blob)
  blobCache.set(trimmedKey, blobUrl)

  return blobUrl
}

export function usePreloadPetImages(photoRefs: string[]) {
  useEffect(() => {
    if (!photoRefs || photoRefs.length === 0) return

    const uniqueKeys = [...new Set(photoRefs.filter(Boolean))]

    Promise.all(uniqueKeys.map((key) => preloadPetImage(key).catch(() => null)))
  }, [photoRefs])
}
