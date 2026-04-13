/**
 * Tests de integración para src/store/authStore.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

// Helper para crear un mock de Session
function mockSession(overrides?: Partial<Session>): Session {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser(),
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  }
}

function mockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-123',
    email: 'test@test.com',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('authStore', () => {
  beforeEach(() => {
    // Reset state
    useAuthStore.setState({
      session: null,
      user: null,
      profile: null,
      isLoading: true,
      isInitialized: false,
    })
    vi.clearAllMocks()
  })

  describe('estado inicial', () => {
    it('isLoading es true', () => {
      expect(useAuthStore.getState().isLoading).toBe(true)
    })

    it('isInitialized es false', () => {
      expect(useAuthStore.getState().isInitialized).toBe(false)
    })

    it('session, user, profile son null', () => {
      const state = useAuthStore.getState()
      expect(state.session).toBeNull()
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
    })
  })

  describe('initialize', () => {
    it('setea isInitialized y quita isLoading después de inicializar', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      await useAuthStore.getState().initialize()

      expect(useAuthStore.getState().isInitialized).toBe(true)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })

    it('restaura sesión existente', async () => {
      const session = mockSession()

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session },
        error: null,
      })

      // Mock del fetchProfile
      const mockProfile = {
        id: 'user-123',
        first_name: 'Juan',
        last_name: 'Test',
        email: 'test@test.com',
        role: 'admin' as const,
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }

      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(fromMock as never)

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.session).toBe(session)
      expect(state.user).toBe(session.user)
      expect(state.profile).toEqual(mockProfile)
    })

    it('no setea user si no hay sesión', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      await useAuthStore.getState().initialize()

      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().profile).toBeNull()
    })
  })

  describe('login', () => {
    it('setea session y user tras login exitoso', async () => {
      const session = mockSession()
      const user = mockUser()

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session, user },
        error: null,
      })

      const mockProfile = {
        id: 'user-123',
        first_name: 'Juan',
        last_name: 'Test',
        email: 'test@test.com',
        role: 'admin' as const,
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      }

      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(fromMock as never)

      await useAuthStore.getState().login('test@test.com', 'password')

      const state = useAuthStore.getState()
      expect(state.session).toBe(session)
      expect(state.user).toBe(user)
    })

    it('lanza error si signInWithPassword falla', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid credentials', name: 'AuthApiError', status: 400 } as never,
      })

      await expect(
        useAuthStore.getState().login('bad@test.com', 'wrong')
      ).rejects.toBeDefined()
    })
  })

  describe('logout', () => {
    it('limpia session, user y profile', async () => {
      // Set some state first
      useAuthStore.setState({
        session: mockSession(),
        user: mockUser(),
        profile: {
          id: 'user-123',
          first_name: 'Juan',
          last_name: 'Test',
          email: 'test@test.com',
          role: 'admin',
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      })

      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.session).toBeNull()
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
    })
  })

  describe('fetchProfile', () => {
    it('guarda el profile del usuario', async () => {
      const mockProfile = {
        id: 'user-456',
        first_name: 'María',
        last_name: 'Staff',
        email: 'maria@test.com',
        role: 'staff' as const,
        is_active: true,
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z',
      }

      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }
      vi.mocked(supabase.from).mockReturnValue(fromMock as never)

      await useAuthStore.getState().fetchProfile('user-456')

      expect(useAuthStore.getState().profile).toEqual(mockProfile)
    })

    it('no setea profile si hay error', async () => {
      const fromMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'not found' },
        }),
      }
      vi.mocked(supabase.from).mockReturnValue(fromMock as never)

      await useAuthStore.getState().fetchProfile('nonexistent')

      expect(useAuthStore.getState().profile).toBeNull()
    })
  })
})
