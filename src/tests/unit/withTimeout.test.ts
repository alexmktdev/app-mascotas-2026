/**
 * Tests unitarios para src/lib/withTimeout.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { withTimeout } from '@/lib/withTimeout'

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resuelve si la promesa completa antes del timeout', async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('ok'), 100)
    })

    const resultPromise = withTimeout(promise, 5000, 'timeout!')
    vi.advanceTimersByTime(100)
    const result = await resultPromise
    expect(result).toBe('ok')
  })

  it('rechaza con mensaje custom si excede el timeout', async () => {
    const neverResolves = new Promise<string>(() => {
      // Nunca resuelve
    })

    const resultPromise = withTimeout(neverResolves, 1000, 'Se agotó el tiempo')
    vi.advanceTimersByTime(1000)

    await expect(resultPromise).rejects.toThrow('Se agotó el tiempo')
  })

  it('propaga el error de la promesa original', async () => {
    const failing = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('fallo original')), 100)
    })

    const resultPromise = withTimeout(failing, 5000, 'timeout!')
    vi.advanceTimersByTime(100)

    await expect(resultPromise).rejects.toThrow('fallo original')
  })

  it('limpia el timeout al resolver exitosamente', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('done'), 50)
    })

    const resultPromise = withTimeout(promise, 5000, 'timeout!')
    vi.advanceTimersByTime(50)
    await resultPromise

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })

  it('limpia el timeout al rechazar', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('fail')), 50)
    })

    const resultPromise = withTimeout(promise, 5000, 'timeout!')
    vi.advanceTimersByTime(50)

    try {
      await resultPromise
    } catch {
      // esperado
    }

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})
