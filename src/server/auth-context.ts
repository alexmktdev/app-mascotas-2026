import 'server-only'

import { getSessionUser, type SessionUser } from '@/server/session'
import { ActionError } from '@/server/errors'

/** Lanza si no hay sesión activa. Devuelve el usuario autenticado. */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSessionUser()
  if (!session) {
    throw new ActionError('unauthenticated', 'Debe iniciar sesión')
  }
  return session
}

/** Solo admins activos. */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth()
  const profile = session.profile
  if (!profile) {
    throw new ActionError('not-found', 'Perfil no encontrado')
  }
  if (!profile.is_active) {
    throw new ActionError('permission-denied', 'Usuario desactivado')
  }
  if (profile.role !== 'admin') {
    throw new ActionError('permission-denied', 'Solo administradores pueden realizar esta acción')
  }
  return session
}

/** Mascotas y adopciones: admin o staff (alineado con rutas del panel). */
export async function requireStaffOrAdmin(): Promise<SessionUser> {
  const session = await requireAuth()
  const profile = session.profile
  if (!profile) {
    throw new ActionError('not-found', 'Perfil no encontrado')
  }
  if (!profile.is_active) {
    throw new ActionError('permission-denied', 'Usuario desactivado')
  }
  if (profile.role !== 'admin' && profile.role !== 'staff') {
    throw new ActionError('permission-denied', 'Solo personal autorizado puede realizar esta acción')
  }
  return session
}
