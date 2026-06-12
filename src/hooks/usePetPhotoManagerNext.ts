/**
 * Hook para gestionar fotos de mascotas en el panel Next.
 * Sube/elimina vía /api/pets/[id]/photos (Route Handler -> R2 + Firestore).
 */

import { useCallback, useState, useEffect } from 'react'
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
  removePhoto: (index: number) => Promise<void>
  isUploading: boolean
  uploadAll: (petIdOverride?: string) => Promise<void>
}

const allowedMime = new Set<string>(PET_PHOTO_MIME_TYPES)
const MAX_PHOTOS = 5

export function usePetPhotoManagerNext({
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

  const removePhoto = useCallback(async (index: number) => {
    const entry = photoEntries[index]
    if (!entry) return

    if (entry.kind === 'existing') {
      try {
        const res = await fetch(`/api/pets/${petId}/photos`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl: entry.url }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? 'No se pudo eliminar la foto')
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la foto')
        return
      }
    }

    setPhotoEntries((prev) => prev.filter((_, i) => i !== index))
  }, [photoEntries, petId])

  const uploadAll = useCallback(async (petIdOverride?: string): Promise<void> => {
    const targetPetId = petIdOverride ?? petId
    if (!targetPetId) {
      throw new Error('ID de mascota requerido')
    }

    const newEntries = photoEntries.filter((e) => e.kind === 'new')
    if (newEntries.length === 0) return

    setIsUploading(true)
    try {
      for (const entry of newEntries) {
        if (entry.kind !== 'new') continue
        const formData = new FormData()
        formData.set('file', entry.file)
        const res = await fetch(`/api/pets/${targetPetId}/photos`, {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? 'No se pudo subir la foto')
        }
      }
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
  }
}
