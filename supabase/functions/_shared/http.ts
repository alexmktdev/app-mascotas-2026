/**
 * Respuestas JSON uniformes y errores HTTP para Edge Functions.
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export type HttpErrorInit = { status: number; message: string }

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'HttpError'
  }
}

export function jsonResponse(
  body: unknown,
  status: number,
  headers: Record<string, string> = corsHeaders,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}

/** Solo POST con cuerpo JSON y tamaño acotado (mitiga payloads enormes). */
export async function readJsonBody<T>(req: Request, maxBytes = 48_000): Promise<T> {
  if (req.method !== 'POST') {
    throw new HttpError(405, 'Método no permitido')
  }
  const ct = req.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    throw new HttpError(400, 'Content-Type debe ser application/json')
  }
  const raw = await req.text()
  if (raw.length > maxBytes) {
    throw new HttpError(413, 'Cuerpo de la petición demasiado grande')
  }
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new HttpError(400, 'JSON inválido')
  }
}

export function handleHttpError(error: unknown): Response {
  if (error instanceof HttpError) {
    return jsonResponse({ error: error.message }, error.status)
  }
  const message = error instanceof Error ? error.message : 'Error interno'
  console.error('edge error:', message)
  return jsonResponse({ error: message }, 400)
}
