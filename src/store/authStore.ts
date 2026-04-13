/**
 * Store de autenticación con Zustand.
 * Maneja: session, user, profile (con rol).
 */

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import type { Session, User } from '@supabase/supabase-js'
import { logger } from '@/utils'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean

  // Acciones
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      // Restaurar sesión existente
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        set({ session, user: session.user })
        await get().fetchProfile(session.user.id)
      }

      // Suscribirse a cambios de auth
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        logger.log('Auth event:', event)

        if (event === 'SIGNED_IN' && newSession?.user) {
          set({ session: newSession, user: newSession.user })
          await get().fetchProfile(newSession.user.id)
        }

        if (event === 'SIGNED_OUT') {
          set({ session: null, user: null, profile: null })
        }

        if (event === 'TOKEN_REFRESHED' && newSession) {
          set({ session: newSession })
        }
      })
    } catch (error) {
      logger.error('Error inicializando auth:', error)
    } finally {
      set({ isLoading: false, isInitialized: true })
    }
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    set({ session: data.session, user: data.user })
    if (data.user) {
      await get().fetchProfile(data.user.id)
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null })
  },

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, is_active, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (error) {
      logger.error('Error cargando perfil:', error)
      return
    }

    set({ profile: data })
  },
}))
