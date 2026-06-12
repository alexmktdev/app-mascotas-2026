import 'server-only'

/**
 * Error de Server Action con código semántico (espejo de firebase-functions HttpsError),
 * para que las Server Actions devuelvan mensajes consistentes al cliente.
 */
export type ActionErrorCode =
  | 'unauthenticated'
  | 'permission-denied'
  | 'not-found'
  | 'invalid-argument'
  | 'failed-precondition'

export class ActionError extends Error {
  code: ActionErrorCode

  constructor(code: ActionErrorCode, message: string) {
    super(message)
    this.name = 'ActionError'
    this.code = code
  }
}

/** Convierte cualquier error en un mensaje seguro para devolver al cliente. */
export function toActionErrorMessage(error: unknown): string {
  if (error instanceof ActionError) return error.message
  return 'Ocurrió un error inesperado. Intenta nuevamente.'
}
