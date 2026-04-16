/**
 * Store de autenticación con Zustand + Firebase Auth.
 */

import { create } from 'zustand'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { fetchProfile } from '@/lib/auth-firebase'
import { logger } from '@/utils'
import type { Profile } from '@/types/firebase.types'

let authUnsubscribe: (() => void) | null = null

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean

  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    if (authUnsubscribe) return

    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      logger.log('[Auth] onAuthStateChanged:', user?.email)

      if (user) {
        set({ user })
        const profile = await fetchProfile(user.uid)
        set({ profile })
      } else {
        set({ user: null, profile: null })
      }

      set({ isLoading: false, isInitialized: true })
    })
  },

  login: async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    set({ user: result.user })
    const profile = await fetchProfile(result.user.uid)
    set({ profile })
  },

  logout: async () => {
    await signOut(auth)
    set({ user: null, profile: null })
  },
}))
