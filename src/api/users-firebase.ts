/**
 * API de usuarios — LECTURA SOLO.
 * Toda escritura (create, update, delete) va por Cloud Functions.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Profile } from '@/types/firebase.types'

const profilesCollection = collection(db, 'profiles')

function profileFromData(id: string, data: Record<string, unknown>): Profile {
  return {
    id,
    first_name: data.first_name as string,
    last_name: data.last_name as string,
    email: data.email as string,
    role: data.role as 'admin' | 'staff',
    is_active: data.is_active as boolean,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  }
}

// ─── SOLO LECTURA ─────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<Profile[]> {
  const q = query(profilesCollection, orderBy('created_at', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => profileFromData(d.id, d.data()))
}

export async function fetchUserById(id: string): Promise<Profile> {
  const docRef = doc(db, 'profiles', id)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) {
    throw new Error('Usuario no encontrado')
  }
  return profileFromData(docSnap.id, docSnap.data())
}

// ─── ESTAS FUNCIONES YA NO SE USAN — la escritura va por Cloud Functions ─────

export async function updateUser(_id: string, _updates: unknown): Promise<never> {
  throw new Error('No llamar directly. Use functionsUpdateUser from @/lib/functions')
}

export async function createUser(_payload: unknown): Promise<never> {
  throw new Error('No llamar directly. Use functionsCreateUser from @/lib/functions')
}

export async function deleteUser(_userId: string): Promise<never> {
  throw new Error('No llamar directly. Use functionsDeleteUser from @/lib/functions')
}