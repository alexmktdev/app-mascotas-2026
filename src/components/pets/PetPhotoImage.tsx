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
  priority?: boolean
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

  function getInitialUrl(): string {
    if (!key) return ''
    const cached = getCachedUrl(key)
    if (cached) return cached
    if (key.startsWith('https://')) {
      setCachedUrl(key, key)
      return key
    }
    return ''
  }

  const [imgSrc, setImgSrc] = useState(getInitialUrl)
  const [visible, setVisible] = useState(!!imgSrc)

  useEffect(() => {
    if (!key || imgSrc) return

    let cancelled = false
    const storageRef = ref(storage, key)
    getDownloadURL(storageRef).then((url) => {
      setCachedUrl(key, url)
      if (!cancelled) {
        setImgSrc(url)
      }
    }).catch(() => {
      if (!cancelled) setVisible(true)
    })

    return () => { cancelled = true }
  }, [key, imgSrc])

  return (
    <div
      className={`relative overflow-hidden bg-surface-100 ${className}`}
      style={{ aspectRatio: aspectRatio ?? '1/1' }}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={alt}
          className={`${imageClassName} transition-opacity duration-200`}
          loading={loading}
          decoding="async"
          {...(priority ? { fetchPriority: 'high' as const } : {})}
          style={{ opacity: visible ? 1 : 0 }}
          onLoad={() => setVisible(true)}
          onError={() => setVisible(true)}
        />
      ) : null}
      {!visible && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="h-6 w-6 animate-spin text-surface-300" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}
    </div>
  )
})
