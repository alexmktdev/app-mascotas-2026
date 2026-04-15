/**
 * Hook para gestionar fotos de mascotas.
 * Maneja entries locales/nuevas y sube a Storage cuando se requiere.
 */

import { useCallback, useState } from 'react'
import { uploadPetPhoto } from '@/api/petPhotosStorage'
import {
  PET_PHOTO_MAX_BYTES,
  PET_PHOTO_MAX_SIZE_LABEL_ES,
  PET_PHOTO_MIME_TYPES,
} from '@/constants'
import toast from 'react-hot-toast'

export type PhotoEntry =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; file: File; localId: string }

interface UsePetPhotoManagerOptions {
  userId: string
  existingUrls?: string[]
}

interface UsePetPhotoManagerReturn {
  photoEntries: PhotoEntry[]
  addPhoto: (file: File) => boolean
  removePhoto: (index: number) => void
  isUploading: boolean
  uploadAll: () => Promise<string[]>
  clearNew: () => void
}

const allowedMime = new Set<string>(PET_PHOTO_MIME_TYPES)

export function usePetPhotoManager({
  userId,
  existingUrls = [],
}: UsePetPhotoManagerOptions): UsePetPhotoManagerReturn {
  const [photoEntries, setPhotoEntries] = useState<PhotoEntry[]>(() =>
    existingUrls.map((url) => ({ kind: 'existing' as const, url })),
  )
  const [isUploading, setIsUploading] = useState(false)

  const addPhoto = useCallback(
    (file: File): boolean => {
      if (photoEntries.length >= 2) {
        toast.error('Máximo 2 fotos por mascota')
        return false
      }
      if (file.size > PET_PHOTO_MAX_BYTES) {
        toast.error(`Cada imagen puede pesar como máximo ${PET_PHOTO_MAX_SIZE_LABEL_ES}`)
        return false
      }
      if (!allowedMime.has(file.type)) {
        toast.error('Solo se permiten fotos JPEG o PNG')
        return false
      }
      setPhotoEntries((prev) => [
        ...prev,
        { kind: 'new', file, localId: crypto.randomUUID() },
      ])
      return true
    },
    [photoEntries.length],
  )

  const removePhoto = useCallback((index: number) => {
    setPhotoEntries((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearNew = useCallback(() => {
    setPhotoEntries((prev) => prev.filter((e) => e.kind === 'existing'))
  }, [])

  const uploadAll = useCallback(async (): Promise<string[]> => {
    if (!userId) {
      throw new Error('Debes iniciar sesión para subir fotos')
    }

    setIsUploading(true)
    const urls: string[] = []

    try {
      for (const entry of photoEntries) {
        if (entry.kind === 'existing') {
          urls.push(entry.url)
        } else {
          const uploadedUrl = await uploadPetPhoto(userId, entry.file)
          urls.push(uploadedUrl)
        }
      }
      return urls
    } finally {
      setIsUploading(false)
    }
  }, [photoEntries, userId])

  return {
    photoEntries,
    addPhoto,
    removePhoto,
    isUploading,
    uploadAll,
    clearNew,
  }
}
