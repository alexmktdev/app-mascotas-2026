import { useEffect, useState, memo } from 'react'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { getCachedUrl, setCachedUrl } from '@/hooks/usePreloadPetImages'

interface PetPhotoImageProps {
  photoRef: string
  alt: string
  className?: string
  imageClassName?: string
  loading?: 'eager' | 'lazy'
  aspectRatio?: string
  /** true for above-the-fold images (first 3 cards) */
  priority?: boolean
}

function resolveInitialUrl(key: string): string {
  if (!key) return ''
  const cached = getCachedUrl(key)
  if (cached) return cached
  if (key.startsWith('https://firebasestorage.googleapis.com')) {
    setCachedUrl(key, key)
    return key
  }
  return ''
}

export const PetPhotoImage = memo(function PetPhotoImage({
  photoRef,
  alt,
  className = '',
  imageClassName = 'h-full w-full object-cover',
  loading = 'eager',
  aspectRatio,
  priority = false,
}: PetPhotoImageProps) {
  const key = photoRef.trim()
  const initialUrl = resolveInitialUrl(key)

  const [imgSrc, setImgSrc] = useState<string>(initialUrl)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!key) {
      setImgSrc('')
      setIsLoaded(true)
      return
    }

    if (imgSrc) return

    let cancelled = false

    ;(async () => {
      try {
        const cached = getCachedUrl(key)
        if (cached) {
          if (!cancelled) setImgSrc(cached)
          return
        }
        const storageRef = ref(storage, key)
        const url = await getDownloadURL(storageRef)
        setCachedUrl(key, url)
        if (!cancelled) setImgSrc(url)
      } catch {
        if (!cancelled) setIsLoaded(true)
      }
    })()

    return () => { cancelled = true }
  }, [key, imgSrc])

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio } : { aspectRatio: '1/1' }}
    >
      <div className="absolute inset-0 bg-surface-100" />
      {!isLoaded && imgSrc && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <svg className="h-8 w-8 animate-spin text-surface-400" viewBox="0 0 24 24" fill="none">
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
          decoding="async"
          {...(priority ? { fetchPriority: 'high' as const } : {})}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
          style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.15s ease-out', willChange: 'opacity' }}
        />
      ) : (
        !isLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <svg className="h-8 w-8 animate-spin text-surface-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )
      )}
    </div>
  )
})
