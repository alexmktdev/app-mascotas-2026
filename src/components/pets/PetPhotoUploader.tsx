/**
 * Componente de UI para gestión de fotos de mascotas.
 * Solo se encarga de la parte visual: previews, botones, validación.
 * La lógica de negocio (upload, state) vive en usePetPhotoManager.
 */

import { useEffect, memo, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { PetPhotoImage } from '@/components/pets/PetPhotoImage'
import { Plus, Trash2 } from 'lucide-react'
import { PET_PHOTO_ACCEPT_ATTR } from '@/constants'
import type { PhotoEntry } from '@/hooks/usePetPhotoManager'

interface PetPhotoUploaderProps {
  photoEntries: PhotoEntry[]
  addPhoto: (file: File) => boolean
  removePhoto: (index: number) => void
  isUploading: boolean
}

const LocalFilePreview = memo(function LocalFilePreview({
  file,
  className,
}: {
  file: File
  className?: string
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  if (!url) {
    return <div className={`${className ?? ''} bg-surface-100 animate-pulse`} aria-hidden />
  }
  return <img src={url} alt="" className={className} />
})

export const PetPhotoUploader = memo(function PetPhotoUploader({
  photoEntries,
  addPhoto,
  removePhoto,
  isUploading,
}: PetPhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onFilePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) addPhoto(file)
  }

  return (
    <fieldset className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
      <legend className="px-2 text-sm font-bold text-surface-800">Fotos</legend>
      <p className="text-sm text-surface-500">
        Hasta 2 imágenes, máximo 1.2 MB cada una (solo JPEG o PNG).
      </p>

      {photoEntries.map((entry, index) => (
        <div key={entry.kind === 'existing' ? entry.url : entry.localId} className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-surface-600">
              {entry.kind === 'existing' ? 'Foto guardada' : 'Nueva foto'}
            </p>
            <div className="mt-2 h-28 w-28 overflow-hidden rounded-lg border border-surface-200">
              {entry.kind === 'existing' ? (
                <PetPhotoImage
                  photoRef={entry.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <LocalFilePreview file={entry.file} className="h-full w-full object-cover" />
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => removePhoto(index)}
            disabled={isUploading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {photoEntries.length < 2 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          isLoading={isUploading}
        >
          <Plus className="h-4 w-4" />
          Agregar foto
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={PET_PHOTO_ACCEPT_ATTR}
        className="hidden"
        aria-label="Seleccionar imagen para la ficha de la mascota"
        onChange={onFilePick}
      />
    </fieldset>
  )
})
