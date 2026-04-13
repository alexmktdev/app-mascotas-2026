/**
 * Fetch con tiempo máximo de espera para todas las llamadas HTTP de Supabase.
 * Sin esto, si la red o el proyecto quedan colgados, React Query puede mostrar
 * carga infinita y las mutaciones (p. ej. eliminar) quedan en pending hasta F5.
 */

/** Subida de fotos + PostgREST en redes lentas; demasiado bajo cortaba operaciones válidas. */
export const SUPABASE_REQUEST_TIMEOUT_MS = 60_000

export function createFetchWithDeadline(timeoutMs: number): typeof fetch {
  return function fetchWithDeadline(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const parent = init?.signal
    if (parent?.aborted) {
      return Promise.reject(new DOMException('Aborted', 'AbortError'))
    }

    const AS = AbortSignal as typeof AbortSignal & {
      timeout?: (ms: number) => AbortSignal
      any?: (signals: AbortSignal[]) => AbortSignal
    }
    if (typeof AS.timeout === 'function' && typeof AS.any === 'function') {
      const t = AS.timeout(timeoutMs)
      const signal = parent ? AS.any([parent, t]) : t
      return fetch(input, { ...init, signal })
    }

    const combined = new AbortController()
    const timeoutId = setTimeout(() => combined.abort(), timeoutMs)

    const onParentAbort = () => {
      clearTimeout(timeoutId)
      combined.abort()
    }
    if (parent) {
      parent.addEventListener('abort', onParentAbort, { once: true })
    }

    return fetch(input, { ...init, signal: combined.signal }).finally(() => {
      clearTimeout(timeoutId)
      if (parent) {
        parent.removeEventListener('abort', onParentAbort)
      }
    })
  }
}

export const fetchWithDeadline = createFetchWithDeadline(SUPABASE_REQUEST_TIMEOUT_MS)
