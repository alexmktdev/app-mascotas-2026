import 'server-only'

import { unstable_cache } from 'next/cache'
import { Timestamp } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { writeAuditLog } from '@/server/audit'
import { ActionError } from '@/server/errors'
import type { Profile } from '@/types/firebase.types'

const profilesCollection = () => adminDb.collection('profiles')

/** Normaliza Firestore Timestamp (u otros valores) a string ISO 8601. */
function toIsoString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Timestamp) return value.toDate().toISOString()
  return ''
}

function profileFromData(id: string, data: Record<string, unknown>): Profile {
  return {
    id,
    first_name: data.first_name as string,
    last_name: data.last_name as string,
    email: data.email as string,
    role: data.role as 'admin' | 'staff',
    is_active: data.is_active as boolean,
    created_at: toIsoString(data.created_at),
    updated_at: toIsoString(data.updated_at),
  }
}

// ─────────────────────────────────────────────────────────────────────────
// LECTURA
// ─────────────────────────────────────────────────────────────────────────

export const fetchUsers = unstable_cache(
  fetchUsersUncached,
  ['fetch-users'],
  { revalidate: 30, tags: ['users'] },
)

async function fetchUsersUncached(): Promise<Profile[]> {
  const snapshot = await profilesCollection().orderBy('created_at', 'desc').get()
  return snapshot.docs.map((d) => profileFromData(d.id, d.data()))
}

export const fetchUserById = unstable_cache(
  fetchUserByIdUncached,
  ['fetch-user-by-id'],
  { revalidate: 30, tags: ['users'] },
)

async function fetchUserByIdUncached(id: string): Promise<Profile | null> {
  const snap = await profilesCollection().doc(id).get()
  if (!snap.exists) return null
  return profileFromData(snap.id, snap.data()!)
}

// ─────────────────────────────────────────────────────────────────────────
// ESCRITURA — port 1:1 de functions/src/index.ts (createUser/updateUser/deleteUser).
// Solo admins (verificado en users-actions.ts vía requireAdmin).
// ─────────────────────────────────────────────────────────────────────────

export type CreateUserInput = {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'admin' | 'staff'
}

export async function createUserRecord(performedBy: string, input: CreateUserInput): Promise<{ uid: string; email: string | undefined }> {
  const { email, password, first_name, last_name, role } = input

  if (role !== 'admin' && role !== 'staff') {
    throw new ActionError('invalid-argument', 'Rol inválido')
  }
  if (password.length < 8) {
    throw new ActionError('invalid-argument', 'La contraseña debe tener al menos 8 caracteres')
  }

  const userRecord = await adminAuth.createUser({ email, password })

  const nowIso = new Date().toISOString()
  const profile = {
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    email: email.trim().toLowerCase(),
    role,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  }
  await profilesCollection().doc(userRecord.uid).set(profile)

  await writeAuditLog('profiles', userRecord.uid, 'INSERT', null, { email, role, created_by: performedBy }, performedBy)

  return { uid: userRecord.uid, email: userRecord.email }
}

export type UpdateUserInput = {
  first_name?: string
  last_name?: string
  email?: string
  role?: 'admin' | 'staff'
  is_active?: boolean
  password?: string
}

export async function updateUserRecord(performedBy: string, uid: string, input: UpdateUserInput): Promise<void> {
  const { first_name, last_name, email, role, is_active, password } = input

  // Prevenir que un admin se desactive a sí mismo
  if (uid === performedBy && is_active === false) {
    throw new ActionError('permission-denied', 'No puedes desactivarte a ti mismo')
  }

  if (role !== undefined && role !== 'admin' && role !== 'staff') {
    throw new ActionError('invalid-argument', 'Rol inválido')
  }

  if (password !== undefined && password.trim() !== '') {
    if (password.length < 8) {
      throw new ActionError('invalid-argument', 'La contraseña debe tener al menos 8 caracteres')
    }
    await adminAuth.updateUser(uid, { password })
  }

  if (email !== undefined) {
    await adminAuth.updateUser(uid, { email: email.trim().toLowerCase() })
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (first_name !== undefined) updateData.first_name = first_name.trim()
  if (last_name !== undefined) updateData.last_name = last_name.trim()
  if (email !== undefined) updateData.email = email.trim().toLowerCase()
  if (role !== undefined) updateData.role = role
  if (is_active !== undefined) updateData.is_active = is_active

  const profileRef = profilesCollection().doc(uid)
  const beforeSnap = await profileRef.get()
  if (!beforeSnap.exists) {
    throw new ActionError('not-found', 'Usuario no encontrado')
  }
  const beforeData = beforeSnap.data() ?? null

  await profileRef.update(updateData)

  await writeAuditLog('profiles', uid, 'UPDATE', beforeData, updateData, performedBy)

  if (is_active === false) {
    await adminAuth.revokeRefreshTokens(uid)
  }
}

export async function deleteUserRecord(performedBy: string, uid: string): Promise<void> {
  // Prevenir que un admin se elimine a sí mismo
  if (uid === performedBy) {
    throw new ActionError('permission-denied', 'No puedes eliminarte a ti mismo')
  }

  const profileRef = profilesCollection().doc(uid)
  const profileSnap = await profileRef.get()
  const profileData = profileSnap.exists ? profileSnap.data() ?? null : null

  await adminAuth.deleteUser(uid)
  await profileRef.delete()

  await writeAuditLog('profiles', uid, 'DELETE', profileData, null, performedBy)
}
