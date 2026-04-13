/**
 * Tests unitarios para src/utils/index.ts — funciones puras.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatRelativeDate,
  formatDate,
  formatDateTime,
  formatAge,
  extractDriveFileId,
  buildDriveImageUrl,
  isValidDriveUrl,
  isEphemeralImageRef,
  isPetStoragePublicUrl,
  resolvePetPhotoSrc,
  sanitizeSearchInput,
  debounce,
  PET_IMAGE_FALLBACK,
} from '@/utils'

// ──────────────────────────────────────────────
// formatRelativeDate
// ──────────────────────────────────────────────

describe('formatRelativeDate', () => {
  it('devuelve una cadena relativa en español', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString()
    const result = formatRelativeDate(yesterday)
    expect(result).toContain('hace')
  })
})

// ──────────────────────────────────────────────
// formatDate
// ──────────────────────────────────────────────

describe('formatDate', () => {
  it('formatea "2026-04-12" como "12 abr 2026"', () => {
    // Usar hora del mediodía UTC para evitar cambio de día por timezone
    const result = formatDate('2026-04-12T12:00:00Z')
    expect(result).toMatch(/12\s+abr\s+2026/i)
  })

  it('formatea un mes distinto correctamente', () => {
    const result = formatDate('2026-01-05T10:00:00Z')
    expect(result).toMatch(/05\s+ene\s+2026/i)
  })
})

// ──────────────────────────────────────────────
// formatDateTime
// ──────────────────────────────────────────────

describe('formatDateTime', () => {
  it('incluye hora y minutos', () => {
    const result = formatDateTime('2026-04-12T14:30:00Z')
    // La hora depende de la zona horaria del test runner, pero debe contener "de" y ","
    expect(result).toContain('de')
    expect(result).toContain(',')
  })
})

// ──────────────────────────────────────────────
// formatAge
// ──────────────────────────────────────────────

describe('formatAge', () => {
  it('0 meses → "Menos de 1 mes"', () => {
    expect(formatAge(0)).toBe('Menos de 1 mes')
  })

  it('1 mes → "1 mes"', () => {
    expect(formatAge(1)).toBe('1 mes')
  })

  it('7 meses → "7 meses"', () => {
    expect(formatAge(7)).toBe('7 meses')
  })

  it('11 meses → "11 meses"', () => {
    expect(formatAge(11)).toBe('11 meses')
  })

  it('12 meses → "1 año"', () => {
    expect(formatAge(12)).toBe('1 año')
  })

  it('13 meses → "1 año y 1 mes"', () => {
    expect(formatAge(13)).toBe('1 año y 1 mes')
  })

  it('25 meses → "2 años y 1 mes"', () => {
    expect(formatAge(25)).toBe('2 años y 1 mes')
  })

  it('24 meses → "2 años"', () => {
    expect(formatAge(24)).toBe('2 años')
  })

  it('120 meses → "10 años"', () => {
    expect(formatAge(120)).toBe('10 años')
  })

  it('26 meses → "2 años y 2 meses"', () => {
    expect(formatAge(26)).toBe('2 años y 2 meses')
  })
})

// ──────────────────────────────────────────────
// extractDriveFileId
// ──────────────────────────────────────────────

describe('extractDriveFileId', () => {
  it('extrae id de URL completa /file/d/...', () => {
    const url = 'https://drive.google.com/file/d/1a2B3c_D4-EfG/view?usp=sharing'
    expect(extractDriveFileId(url)).toBe('1a2B3c_D4-EfG')
  })

  it('extrae id de parámetro ?id=', () => {
    const url = 'https://drive.google.com/open?id=abc123_XYZ'
    expect(extractDriveFileId(url)).toBe('abc123_XYZ')
  })

  it('devuelve el id plano sin cambios', () => {
    expect(extractDriveFileId('abc123_XYZ-456')).toBe('abc123_XYZ-456')
  })

  it('devuelve null para string vacío', () => {
    expect(extractDriveFileId('')).toBeNull()
  })

  it('devuelve null para string con solo espacios', () => {
    expect(extractDriveFileId('   ')).toBeNull()
  })

  it('maneja URLs con caracteres extra', () => {
    const url = 'https://drive.google.com/file/d/testId123/edit'
    expect(extractDriveFileId(url)).toBe('testId123')
  })
})

// ──────────────────────────────────────────────
// buildDriveImageUrl
// ──────────────────────────────────────────────

describe('buildDriveImageUrl', () => {
  it('construye URL con tamaño card (w400) por defecto', () => {
    const url = buildDriveImageUrl('abc123')
    expect(url).toContain('id=abc123')
    expect(url).toContain('sz=w400')
  })

  it('construye URL con tamaño detail (w800)', () => {
    const url = buildDriveImageUrl('abc123', 'detail')
    expect(url).toContain('sz=w800')
  })

  it('retorna fallback para id inválido (string vacío)', () => {
    expect(buildDriveImageUrl('')).toBe(PET_IMAGE_FALLBACK)
  })

  it('extrae el id de una URL completa antes de construir', () => {
    const url = buildDriveImageUrl('https://drive.google.com/file/d/myId/view')
    expect(url).toContain('id=myId')
    expect(url).not.toContain('drive.google.com/file')
  })
})

// ──────────────────────────────────────────────
// isValidDriveUrl
// ──────────────────────────────────────────────

describe('isValidDriveUrl', () => {
  it('true para URL de Drive válida', () => {
    expect(isValidDriveUrl('https://drive.google.com/file/d/abc/view')).toBe(true)
  })

  it('true para id plano', () => {
    expect(isValidDriveUrl('abc123')).toBe(true)
  })

  it('false para string vacío', () => {
    expect(isValidDriveUrl('')).toBe(false)
  })
})

// ──────────────────────────────────────────────
// isEphemeralImageRef
// ──────────────────────────────────────────────

describe('isEphemeralImageRef', () => {
  it('true para blob:', () => {
    expect(isEphemeralImageRef('blob:http://localhost/abc')).toBe(true)
  })

  it('true para data:', () => {
    expect(isEphemeralImageRef('data:image/png;base64,abc')).toBe(true)
  })

  it('false para URL HTTP', () => {
    expect(isEphemeralImageRef('https://example.com/img.jpg')).toBe(false)
  })

  it('false para id de Drive', () => {
    expect(isEphemeralImageRef('abc123_DEF')).toBe(false)
  })

  it('maneja espacios en blanco', () => {
    expect(isEphemeralImageRef('  BLOB:http://test  ')).toBe(true)
  })
})

// ──────────────────────────────────────────────
// isPetStoragePublicUrl
// ──────────────────────────────────────────────

describe('isPetStoragePublicUrl', () => {
  it('true para URL pública de Supabase Storage', () => {
    expect(
      isPetStoragePublicUrl('https://abc.supabase.co/storage/v1/object/public/pet-photos/img.jpg')
    ).toBe(true)
  })

  it('false para URL de Drive', () => {
    expect(isPetStoragePublicUrl('https://drive.google.com/file/d/abc/view')).toBe(false)
  })

  it('false para string sin http', () => {
    expect(isPetStoragePublicUrl('abc123')).toBe(false)
  })
})

// ──────────────────────────────────────────────
// resolvePetPhotoSrc
// ──────────────────────────────────────────────

describe('resolvePetPhotoSrc', () => {
  it('retorna fallback para string vacío', () => {
    expect(resolvePetPhotoSrc('')).toBe(PET_IMAGE_FALLBACK)
  })

  it('pasa blob: directamente', () => {
    const url = 'blob:http://localhost/abc'
    expect(resolvePetPhotoSrc(url)).toBe(url)
  })

  it('pasa URL de Storage directamente', () => {
    const url = 'https://abc.supabase.co/storage/v1/object/public/pet-photos/img.jpg'
    expect(resolvePetPhotoSrc(url)).toBe(url)
  })

  it('convierte id de Drive a thumbnail URL', () => {
    const result = resolvePetPhotoSrc('driveFileId123')
    expect(result).toContain('drive.google.com/thumbnail')
    expect(result).toContain('id=driveFileId123')
  })
})

// ──────────────────────────────────────────────
// sanitizeSearchInput
// ──────────────────────────────────────────────

describe('sanitizeSearchInput', () => {
  it('remueve % y _', () => {
    expect(sanitizeSearchInput('hola%mundo_test')).toBe('holamundotest')
  })

  it('remueve backslash', () => {
    expect(sanitizeSearchInput('te\\st')).toBe('test')
  })

  it('trim de espacios', () => {
    expect(sanitizeSearchInput('  hola  ')).toBe('hola')
  })

  it('limita a 100 caracteres', () => {
    const long = 'a'.repeat(200)
    expect(sanitizeSearchInput(long).length).toBe(100)
  })

  it('string vacío devuelve vacío', () => {
    expect(sanitizeSearchInput('')).toBe('')
  })
})

// ──────────────────────────────────────────────
// debounce
// ──────────────────────────────────────────────

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('no ejecuta inmediatamente', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced()
    expect(fn).not.toHaveBeenCalled()
  })

  it('ejecuta después de ms', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced()
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('reinicia el timer con cada llamada', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced()
    vi.advanceTimersByTime(200)
    debounced()
    vi.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('pasa los argumentos correctos', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced('hello', 42)
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith('hello', 42)
  })
})
