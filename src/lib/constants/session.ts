/**
 * Constantes de sesión compartidas entre middleware (Edge) y servidor (Node).
 * Sin dependencias de firebase-admin/server-only para ser Edge-safe.
 */
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'session'
export const SESSION_COOKIE_MAX_AGE_SECONDS = Number(process.env.SESSION_COOKIE_MAX_AGE ?? 432000) // 5 días
