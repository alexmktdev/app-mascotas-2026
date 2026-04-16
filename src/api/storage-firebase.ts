/**
 * API de Firebase Storage para fotos de mascotas.
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { PET_PHOTO_MAX_BYTES, PET_PHOTO_MAX_SIZE_LABEL_ES, PET_PHOTO_MIME_TYPES } from '@/constants'

const PET_PHOTOS_PATH = 'pet-photos'

function extensionForMime(mime: string): 'jpg' | 'png' {
  return mime === 'image/png' ? 'png' : 'jpg'
}

export async function uploadPetPhoto(userId: string, file: File): Promise<string> {
  if (file.size > PET_PHOTO_MAX_BYTES) {
    throw new Error(`Cada imagen puede pesar como máximo ${PET_PHOTO_MAX_SIZE_LABEL_ES}`)
  }
  if (!PET_PHOTO_MIME_TYPES.includes(file.type as 'image/jpeg' | 'image/png')) {
    throw new Error('Solo se permiten fotos JPEG o PNG')
  }

  const ext = extensionForMime(file.type)
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const storageRef = ref(storage, `${PET_PHOTOS_PATH}/${path}`)

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: '31536000',
  })

  const url = await getDownloadURL(storageRef)
  return url
}

export async function deletePetPhotos(urls: string[]): Promise<void> {
  for (const url of urls) {
    try {
      const storageRef = ref(storage, url)
      await deleteObject(storageRef)
    } catch (error) {
      console.warn('[Storage] Error al eliminar foto:', error)
    }
  }
}

export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com')
}

export function extractFirebaseStoragePath(url: string): string | null {
  try {
    const decoded = decodeURIComponent(url)
    const match = decoded.match(/pet-photos%2F(.+?)(?:\?|$)/)
    if (match?.[1]) {
      return match[1].replace('%2F', '/')
    }
    const altMatch = decoded.match(/\/o\/pet-photos%2F(.+?)(?:\?|$)/)
    if (altMatch?.[1]) {
      return altMatch[1].replace(/%2F/g, '/')
    }
    return null
  } catch {
    return null
  }
}
