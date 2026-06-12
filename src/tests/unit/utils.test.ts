/**
 * Tests unitarios para src/utils/index.ts — funciones puras.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatRelativeDate,
  formatDate,
  formatDateTime,
  formatAge,
  sanitizeSearchInput,
  debounce,
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
