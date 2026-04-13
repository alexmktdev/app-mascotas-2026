import { useEffect, useState, memo } from 'react'
import { extractPetPhotoStoragePath, getPetPhotoSignedUrl } from '@/api/petPhotosStorage'
import { isEphemeralImageRef, PET_IMAGE_FALLBACK, resolvePetPhotoSrc } from '@/utils'

type DriveSize = 'card' | 'detail'

interface PetPhotoImageProps {
  photoRef: string
  alt: string
  className?: string
  driveSize?: DriveSize
  loading?: 'eager' | 'lazy'
}

export const PetPhotoImage = memo(function PetPhotoImage({
  photoRef,
  alt,
  className = '',
  driveSize = 'card',
  loading = 'lazy',
}: PetPhotoImageProps) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false

    ;(async () => {
      const t = photoRef.trim()
      if (!t) {
        if (!cancel) setSrc(PET_IMAGE_FALLBACK)
        return
      }
      if (isEphemeralImageRef(t)) {
        if (!cancel) setSrc(t)
        return
      }

      const path = extractPetPhotoStoragePath(t)
      if (path) {
        const signed = await getPetPhotoSignedUrl(path)
        if (cancel) return
        if (signed) {
          setSrc(signed)
          return
        }
        setSrc(resolvePetPhotoSrc(t, driveSize))
        return
      }

      if (!cancel) setSrc(resolvePetPhotoSrc(t, driveSize))
    })()

    return () => {
      cancel = true
    }
  }, [photoRef, driveSize])

  if (!src) {
    return (
      <div
        className={`${className} flex min-h-0 animate-pulse bg-surface-100`}
        aria-hidden
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} block`}
      loading={loading}
      onError={() => setSrc(PET_IMAGE_FALLBACK)}
    />
  )
})
