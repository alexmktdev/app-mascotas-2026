/**
 * Tests unitarios para src/api/petPhotosStorage.ts — funciones puras (extractPetPhotoStoragePath).
 */

import { describe, it, expect } from 'vitest'
import { extractPetPhotoStoragePath } from '@/api/petPhotosStorage'

describe('extractPetPhotoStoragePath', () => {
  it('extrae path de URL pública de pet-photos', () => {
    const url =
      'https://abc.supabase.co/storage/v1/object/public/pet-photos/user123/image.jpg'
    expect(extractPetPhotoStoragePath(url)).toBe('user123/image.jpg')
  })

  it('extrae path de URL firmada de pet-photos', () => {
    const url =
      'https://abc.supabase.co/storage/v1/object/sign/pet-photos/user123/photo.png?token=abc123'
    expect(extractPetPhotoStoragePath(url)).toBe('user123/photo.png')
  })

  it('retorna null para blob: URL', () => {
    expect(extractPetPhotoStoragePath('blob:http://localhost/abc')).toBeNull()
  })

  it('retorna null para data: URL', () => {
    expect(extractPetPhotoStoragePath('data:image/png;base64,abc')).toBeNull()
  })

  it('retorna null para URL de Drive', () => {
    expect(
      extractPetPhotoStoragePath('https://drive.google.com/file/d/abc/view')
    ).toBeNull()
  })

  it('retorna null para URL de otro bucket', () => {
    expect(
      extractPetPhotoStoragePath(
        'https://abc.supabase.co/storage/v1/object/public/other-bucket/img.jpg'
      )
    ).toBeNull()
  })

  it('maneja paths con caracteres URL-encoded', () => {
    const url =
      'https://abc.supabase.co/storage/v1/object/public/pet-photos/user%20123/foto%201.jpg'
    expect(extractPetPhotoStoragePath(url)).toBe('user 123/foto 1.jpg')
  })

  it('es case-insensitive en el nombre del bucket', () => {
    const url =
      'https://abc.supabase.co/storage/v1/object/public/Pet-Photos/user/img.jpg'
    expect(extractPetPhotoStoragePath(url)).toBe('user/img.jpg')
  })
})
