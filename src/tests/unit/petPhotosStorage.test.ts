/**
 * Tests para extractPetPhotoStoragePath (Firebase Storage).
 */

import { describe, it, expect } from 'vitest'
import { extractPetPhotoStoragePath } from '@/api/petPhotosStorage'

describe('extractPetPhotoStoragePath', () => {
  it('extrae path de URL v0 de Firebase Storage', () => {
    const url =
      'https://firebasestorage.googleapis.com/v0/b/mi-bucket/o/pet-photos%2Fabc%2Ffoto.webp?alt=media&token=xyz'
    expect(extractPetPhotoStoragePath(url)).toBe('pet-photos/abc/foto.webp')
  })

  it('retorna null para blob: URL', () => {
    expect(extractPetPhotoStoragePath('blob:http://localhost/abc')).toBeNull()
  })

  it('retorna null para data: URL', () => {
    expect(extractPetPhotoStoragePath('data:image/png;base64,abc')).toBeNull()
  })

  it('retorna null para URL de Drive', () => {
    expect(
      extractPetPhotoStoragePath('https://drive.google.com/file/d/abc/view'),
    ).toBeNull()
  })

  it('retorna null si el path no es pet-photos/', () => {
    const url =
      'https://firebasestorage.googleapis.com/v0/b/mi-bucket/o/other%2Ffile.jpg?alt=media'
    expect(extractPetPhotoStoragePath(url)).toBeNull()
  })

  it('maneja paths con espacios codificados', () => {
    const url =
      'https://firebasestorage.googleapis.com/v0/b/b/o/pet-photos%2Fx%2Ffoto%201.jpg?alt=media'
    expect(extractPetPhotoStoragePath(url)).toBe('pet-photos/x/foto 1.jpg')
  })
})
