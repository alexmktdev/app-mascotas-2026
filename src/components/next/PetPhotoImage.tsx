'use client'

import { useState, memo } from 'react'
import Image from 'next/image'

interface PetPhotoImageProps {
  /** URL pública (Cloudflare R2 o Firebase Storage histórico). */
  src: string
  alt: string
  className?: string
  imageClassName?: string
  loading?: 'eager' | 'lazy'
  aspectRatio?: string
  priority?: boolean
  /** Tamaños responsivos para next/image (sizes attr). */
  sizes?: string
}

/** Imagen de mascota servida desde una URL pública (R2), optimizada con next/image. */
export const PetPhotoImage = memo(function PetPhotoImage({
  src,
  alt,
  className = '',
  imageClassName = 'h-full w-full object-cover',
  loading = 'eager',
  aspectRatio,
  priority = false,
  sizes = '(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw',
}: PetPhotoImageProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className={`relative overflow-hidden bg-surface-100 ${className}`}
      style={{ aspectRatio: aspectRatio ?? '1/1' }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={`${imageClassName} transition-opacity duration-200`}
        priority={priority}
        loading={priority ? undefined : loading}
        style={{ opacity: visible ? 1 : 0 }}
        onLoad={() => setVisible(true)}
        onError={() => setVisible(true)}
      />
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
