import 'server-only'

import { cookies } from 'next/headers'
import { Timestamp } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_SECONDS } from '@/lib/constants/session'
import type { Profile } from '@/types/firebase.types'

export interface SessionUser {
  uid: string
  email: string | null
  profile: Profile | null
}

/**
 * Cambia un idToken (Firebase Auth client) por una cookie de sesión httpOnly
 * verificada con Admin SDK. Llamar desde la ruta de login.
 */
export async function createSessionCookie(idToken: string): Promise<void> {
  const decoded = await adminAuth.verifyIdToken(idToken)

  // Evita usar idTokens viejos para crear sesiones largas.
  const FIVE_MINUTES_MS = 5 * 60 * 1000
  if (Date.now() - decoded.auth_time * 1000 > FIVE_MINUTES_MS) {
    throw new Error('Token de autenticación reciente requerido. Vuelve a iniciar sesión.')
  }

  const expiresIn = SESSION_COOKIE_MAX_AGE_SECONDS * 1000
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/** Normaliza Firestore Timestamp (u otros valores) a string ISO 8601. */
function toIsoString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Timestamp) return value.toDate().toISOString()
  return ''
}

async function fetchProfile(uid: string): Promise<Profile | null> {
  const snap = await adminDb.collection('profiles').doc(uid).get()
  if (!snap.exists) return null
  const data = snap.data()!
  return {
    id: snap.id,
    first_name: data.first_name ?? '',
    last_name: data.last_name ?? '',
    email: data.email ?? '',
    role: data.role ?? 'staff',
    is_active: data.is_active ?? true,
    created_at: toIsoString(data.created_at),
    updated_at: toIsoString(data.updated_at),
  }
}

/**
 * Lee y verifica la cookie de sesión. Devuelve `null` si no hay sesión
 * o la cookie es inválida/expirada.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!sessionCookie) return null

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    const profile = await fetchProfile(decoded.uid)
    return { uid: decoded.uid, email: decoded.email ?? null, profile }
  } catch {
    return null
  }
}
