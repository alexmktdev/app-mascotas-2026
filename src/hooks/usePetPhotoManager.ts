/**
 * Hook para gestionar fotos de mascotas.
 * Toda escritura va por Cloud Functions (solo admins pueden subir/eliminar).
 */

import { useCallback, useState, useEffect } from 'react'
import { functionsUploadPetPhoto } from '@/lib/functions'
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
  petId: string
  existingUrls?: string[]
}

interface UsePetPhotoManagerReturn {
  photoEntries: PhotoEntry[]
  addPhoto: (file: File) => boolean
  removePhoto: (index: number) => void
  isUploading: boolean
  uploadAll: (petIdOverride?: string) => Promise<string[]>
  clearNew: () => void
}

const allowedMime = new Set<string>(PET_PHOTO_MIME_TYPES)
const MAX_PHOTOS = 5

export function usePetPhotoManager({
  petId,
  existingUrls = [],
}: UsePetPhotoManagerOptions): UsePetPhotoManagerReturn {
  const [photoEntries, setPhotoEntries] = useState<PhotoEntry[]>(() =>
    existingUrls.map((url) => ({ kind: 'existing' as const, url })),
  )
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (existingUrls.length > 0) {
      setPhotoEntries((prev) => {
        const existingOnServer = existingUrls.map((url) => ({ kind: 'existing' as const, url }) as PhotoEntry)
        const newOnes = prev.filter((e) => e.kind === 'new')
        return [...existingOnServer, ...newOnes]
      })
    }
  }, [existingUrls])

  const addPhoto = useCallback(
    (file: File): boolean => {
      if (photoEntries.length >= MAX_PHOTOS) {
        toast.error(`Máximo ${MAX_PHOTOS} fotos por mascota`)
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
    [photoEntries],
  )

  const removePhoto = useCallback((index: number) => {
    setPhotoEntries((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearNew = useCallback(() => {
    setPhotoEntries((prev) => prev.filter((e) => e.kind === 'existing'))
  }, [])

  const uploadAll = useCallback(async (petIdOverride?: string): Promise<string[]> => {
    const targetPetId = petIdOverride ?? petId
    if (!targetPetId) {
      throw new Error('ID de mascota requerido')
    }

    setIsUploading(true)
    const urls: string[] = []

    try {
      for (const entry of photoEntries) {
        if (entry.kind === 'existing') {
          urls.push(entry.url)
        } else {
          // Convertir file a base64 y subir por Cloud Function
          const base64 = await fileToBase64(entry.file)
          const result = await functionsUploadPetPhoto({
            petId: targetPetId,
            photoDataUrl: base64,
          })
          urls.push(result.url)
        }
      }
      return urls
    } finally {
      setIsUploading(false)
    }
  }, [photoEntries, petId])

  return {
    photoEntries,
    addPhoto,
    removePhoto,
    isUploading,
    uploadAll,
    clearNew,
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsDataURL(file)
  })
}