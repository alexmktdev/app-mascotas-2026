/**
 * API de autenticación para Firebase Auth.
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { Profile } from '@/types/firebase.types'

export { signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updatePassword }
export type { User }

export async function fetchProfile(uid: string): Promise<Profile | null> {
  const docRef = doc(db, 'profiles', uid)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) return null
  const data = docSnap.data()
  return {
    id: docSnap.id,
    first_name: data.first_name ?? '',
    last_name: data.last_name ?? '',
    email: data.email ?? '',
    role: data.role ?? 'staff',
    is_active: data.is_active ?? true,
    created_at: data.created_at ?? '',
    updated_at: data.updated_at ?? '',
  }
}

export async function login(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function logout(): Promise<void> {
  await signOut(auth)
}
