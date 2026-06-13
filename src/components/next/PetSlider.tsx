'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { PetPhotoImage } from '@/components/next/PetPhotoImage'

interface PetSliderProps {
  photoUrls: string[]
  petName: string
  size?: 'card' | 'detail'
  /** Índice de la card en la lista (0-2 = eager, resto = lazy) */
  cardIndex?: number
  /** Si se indica, las fotos enlazan a la ficha de la mascota (modo card). Las flechas quedan fuera del link. */
  href?: string
}

const FRAME_CLASS = 'aspect-square w-full min-h-0 overflow-hidden bg-surface-100'

export function PetSlider({ photoUrls, petName, size = 'card', cardIndex = 99, href }: PetSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev()
  }, [emblaApi])
  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext()
  }, [emblaApi])

  const imageWrapperClass = size === 'card' ? 'h-full w-full p-1.5' : 'h-full w-full'
  const imgClass = size === 'card'
    ? 'h-full w-full min-h-0 rounded-2xl border border-surface-200 bg-white object-cover object-center shadow-sm'
    : 'h-full w-full min-h-0 object-cover object-center'
  const sizes = size === 'card'
    ? '(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw'
    : '(min-width: 1024px) 50vw, 100vw'

  if (!photoUrls || photoUrls.length === 0) {
    const content = (
      <div className="text-center">
        <ImageOff className="mx-auto mb-2 h-8 w-8" />
        <p className="text-sm">Sin fotos</p>
      </div>
    )
    if (href) {
      return (
        <Link href={href} className={`flex items-center justify-center text-surface-400 ${FRAME_CLASS}`}>
          {content}
        </Link>
      )
    }
    return <div className={`flex items-center justify-center text-surface-400 ${FRAME_CLASS}`}>{content}</div>
  }

  if (photoUrls.length === 1) {
    const image = (
      <PetPhotoImage
        src={photoUrls[0]!}
        alt={petName}
        loading={cardIndex < 6 ? 'eager' : 'lazy'}
        priority={cardIndex < 6}
        className={imageWrapperClass}
        imageClassName={imgClass}
        sizes={sizes}
      />
    )
    if (href) {
      return (
        <Link href={href} className={FRAME_CLASS}>
          {image}
        </Link>
      )
    }
    return <div className={FRAME_CLASS}>{image}</div>
  }

  const track = (
    <div className="flex h-full min-h-0">
      {photoUrls.map((url, idx) => (
        <div key={`${idx}-${url}`} className="h-full min-h-0 min-w-0 flex-[0_0_100%]">
          <PetPhotoImage
            src={url}
            alt={`${petName} - Foto ${idx + 1}`}
            loading={cardIndex < 6 && idx === 0 ? 'eager' : 'lazy'}
            priority={cardIndex < 6 && idx === 0}
            className={imageWrapperClass}
            imageClassName={imgClass}
            sizes={sizes}
          />
        </div>
      ))}
    </div>
  )

  return (
    <div className="group relative w-full">
      {href ? (
        <Link href={href} ref={emblaRef} className={`block ${FRAME_CLASS}`}>
          {track}
        </Link>
      ) : (
        <div ref={emblaRef} className={FRAME_CLASS}>
          {track}
        </div>
      )}

      {/* Controles */}
      <button
        onClick={scrollPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 opacity-0 shadow-md backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white"
        aria-label="Foto anterior"
      >
        <ChevronLeft className="h-4 w-4 text-surface-700" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 opacity-0 shadow-md backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-white"
        aria-label="Foto siguiente"
      >
        <ChevronRight className="h-4 w-4 text-surface-700" />
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {photoUrls.map((_, idx) => (
          <div key={idx} className="h-1.5 w-1.5 rounded-full bg-white/70 shadow-sm" />
        ))}
      </div>
    </div>
  )
}
