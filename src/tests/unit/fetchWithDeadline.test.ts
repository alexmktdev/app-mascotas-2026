/**
 * Tests unitarios para src/lib/fetchWithDeadline.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createFetchWithDeadline } from '@/lib/fetchWithDeadline'

describe('createFetchWithDeadline', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.fetch = originalFetch
  })

  it('completa si fetch responde antes del timeout', async () => {
    const mockResponse = new Response('ok', { status: 200 })
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const fetchWithDeadline = createFetchWithDeadline(5000)
    const result = await fetchWithDeadline('https://api.test.com/data')

    expect(result.status).toBe(200)
    expect(globalThis.fetch).toHaveBeenCalledOnce()
  })

  it('pasa la señal abort al fetch nativo', async () => {
    const mockResponse = new Response('ok', { status: 200 })
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse)

    const fetchWithDeadline = createFetchWithDeadline(5000)
    await fetchWithDeadline('https://api.test.com/data')

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    // Debe haber pasado init con signal
    expect(callArgs?.[1]).toBeDefined()
    expect(callArgs?.[1]?.signal).toBeDefined()
  })

  it('rechaza si parent signal ya está abortado', async () => {
    const controller = new AbortController()
    controller.abort()

    const fetchWithDeadline = createFetchWithDeadline(5000)
    await expect(
      fetchWithDeadline('https://api.test.com/data', { signal: controller.signal })
    ).rejects.toThrow()
  })
})
