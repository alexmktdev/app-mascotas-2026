/**
 * Slider de fotos con Embla Carousel.
 */

import { useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { PetPhotoImage } from '@/components/pets/PetPhotoImage'

interface PetSliderProps {
  photoUrls: string[]
  petName: string
  size?: 'card' | 'detail'
  /** Índice de la card en la lista (0-2 = eager, resto = lazy) */
  cardIndex?: number
}

/** Detalle: ocupa todo el ancho de la columna, cuadrado proporcional (sin caja gris gigante alrededor). */
function frameClass(size: 'card' | 'detail') {
  if (size === 'detail') {
    return 'aspect-square w-full min-h-0 overflow-hidden bg-surface-100'
  }
  return 'aspect-square w-full min-h-0 overflow-hidden bg-surface-100'
}

export function PetSlider({ photoUrls, petName, size = 'card', cardIndex = 99 }: PetSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    emblaApi?.scrollPrev()
  }, [emblaApi])
  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    emblaApi?.scrollNext()
  }, [emblaApi])

  const frame = frameClass(size)
  const imageWrapperClass = size === 'card'
    ? 'h-full w-full p-1.5'
    : 'h-full w-full'
  const imgClass = size === 'card'
    ? 'h-full w-full min-h-0 rounded-2xl border border-surface-200 bg-white object-cover object-center shadow-sm'
    : 'h-full w-full min-h-0 object-cover object-center'

  if (!photoUrls || photoUrls.length === 0) {
    return (
      <div className={`flex items-center justify-center text-surface-400 ${frame}`}>
        <div className="text-center">
          <ImageOff className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">Sin fotos</p>
        </div>
      </div>
    )
  }

  if (photoUrls.length === 1) {
    return (
      <div className={frame}>
        <PetPhotoImage
          photoRef={photoUrls[0]!}
          alt={petName}
          loading={cardIndex < 3 ? 'eager' : 'lazy'}
          priority={cardIndex < 3}
          className={imageWrapperClass}
          imageClassName={imgClass}
        />
      </div>
    )
  }

  return (
    <div className="group relative w-full">
      <div ref={emblaRef} className={frame}>
        <div className="flex h-full min-h-0">
          {photoUrls.map((url, idx) => (
            <div key={`${idx}-${url}`} className="h-full min-h-0 min-w-0 flex-[0_0_100%]">
              <PetPhotoImage
                photoRef={url}
                alt={`${petName} - Foto ${idx + 1}`}
                loading={cardIndex < 3 && idx === 0 ? 'eager' : 'lazy'}
                priority={cardIndex < 3 && idx === 0}
                className={imageWrapperClass}
                imageClassName={imgClass}
              />
            </div>
          ))}
        </div>
      </div>

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
          <div
            key={idx}
            className="h-1.5 w-1.5 rounded-full bg-white/70 shadow-sm"
          />
        ))}
      </div>
    </div>
  )
}
