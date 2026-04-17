/**
 * Cache de URLs de imágenes en localStorage con TTL.
 * Pre-resuelve URLs y precarga los bytes reales en el browser cache.
 */

import { useEffect } from 'react'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '@/lib/firebase'

const CACHE_PREFIX = 'imgurl:'
const TTL_MS = 7 * 24 * 60 * 60 * 1000

const memoryCache = new Map<string, string>()

export function getCachedUrl(key: string): string | null {
  if (memoryCache.has(key)) return memoryCache.get(key)!
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (raw) {
      const parsed = JSON.parse(raw) as { url: string; exp: number }
      if (parsed.exp > Date.now()) {
        memoryCache.set(key, parsed.url)
        return parsed.url
      }
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
    }
  } catch { /* ignore */ }
  return null
}

export function setCachedUrl(key: string, url: string): void {
  memoryCache.set(key, url)
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({ url, exp: Date.now() + TTL_MS }),
    )
  } catch { /* ignore */ }
}

const preloadedUrls = new Set<string>()

function warmBrowserCache(url: string): void {
  if (preloadedUrls.has(url)) return
  preloadedUrls.add(url)
  const img = new Image()
  img.src = url
}

async function resolveAndWarm(key: string): Promise<void> {
  const trimmed = key.trim()
  if (!trimmed) return

  let url = getCachedUrl(trimmed)
  if (!url) {
    if (trimmed.startsWith('https://')) {
      url = trimmed
    } else {
      url = await getDownloadURL(ref(storage, trimmed))
    }
    setCachedUrl(trimmed, url)
  }
  warmBrowserCache(url)
}

export function usePreloadPetImages(photoRefs: string[]) {
  useEffect(() => {
    if (!photoRefs?.length) return
    const unique = [...new Set(photoRefs.filter(Boolean))]
    unique.forEach((k) => resolveAndWarm(k).catch(() => {}))
  }, [photoRefs])
}
