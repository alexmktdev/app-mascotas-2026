import { useEffect, useState, memo } from 'react'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '@/lib/firebase'

interface PetPhotoImageProps {
  photoRef: string
  alt: string
  className?: string
  imageClassName?: string
  loading?: 'eager' | 'lazy'
  aspectRatio?: string
}

const memoryCache = new Map<string, string>()

function getCachedUrl(key: string): string | null {
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

function setCachedUrl(key: string, url: string): void {
  memoryCache.set(key, url)
  try {
    sessionStorage.setItem(`img:${key}`, url)
  } catch { /* ignore */ }
}

export const PetPhotoImage = memo(function PetPhotoImage({
  photoRef,
  alt,
  className = '',
  imageClassName = 'h-full w-full object-cover',
  loading = 'eager',
  aspectRatio,
}: PetPhotoImageProps) {
  const key = photoRef.trim()
  const cachedUrl = getCachedUrl(key)

  const [imgSrc, setImgSrc] = useState<string>(cachedUrl ?? '')
  const [isLoaded, setIsLoaded] = useState(cachedUrl !== null)

  useEffect(() => {
    if (!key) {
      setImgSrc('')
      setIsLoaded(true)
      return
    }

    const cached = getCachedUrl(key)
    if (cached) {
      setImgSrc(cached)
      setIsLoaded(true)
      return
    }

    setImgSrc('')
    setIsLoaded(false)

    let cancelled = false

    ;(async () => {
      try {
        let url: string
        if (key.startsWith('https://firebasestorage.googleapis.com')) {
          url = key
        } else {
          const storageRef = ref(storage, key)
          url = await getDownloadURL(storageRef)
        }
        setCachedUrl(key, url)
        if (!cancelled) {
          setImgSrc(url)
          setIsLoaded(true)
        }
      } catch {
        if (!cancelled) {
          setIsLoaded(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [key])

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio } : { aspectRatio: '1/1' }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-100">
          <svg className="h-6 w-6 animate-spin text-surface-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={alt}
          className={imageClassName}
          loading={loading}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setIsLoaded(true)
          }}
          style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.15s ease-out', willChange: 'opacity' }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-surface-100">
          <svg className="h-6 w-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  )
})