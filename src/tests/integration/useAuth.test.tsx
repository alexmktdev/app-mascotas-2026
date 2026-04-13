/**
 * Tests de integración para src/hooks/useAuth.ts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import type { Session, User } from '@supabase/supabase-js'

function mockSession(): Session {
  return {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser(),
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  }
}

function mockUser(): User {
  return {
    id: 'user-123',
    email: 'test@test.com',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
  }
}

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: true,
    })
  })

  it('isAuthenticated es false sin sesión', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('isAuthenticated es true con sesión', () => {
    useAuthStore.setState({ session: mockSession() })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('isAdmin es true con profile.role = admin', () => {
    useAuthStore.setState({
      session: mockSession(),
      profile: {
        id: 'user-123',
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    })

    const { result } = renderHook(() => useAuth())
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isStaff).toBe(false)
  })

  it('isStaff es true con profile.role = staff', () => {
    useAuthStore.setState({
      session: mockSession(),
      profile: {
        id: 'user-456',
        first_name: 'Staff',
        last_name: 'User',
        email: 'staff@test.com',
        role: 'staff',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    })

    const { result } = renderHook(() => useAuth())
    expect(result.current.isStaff).toBe(true)
    expect(result.current.isAdmin).toBe(false)
  })

  it('isAdmin y isStaff son false sin profile', () => {
    useAuthStore.setState({ session: mockSession(), profile: null })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isStaff).toBe(false)
  })

  it('expone isLoading e isInitialized del store', () => {
    useAuthStore.setState({ isLoading: true, isInitialized: false })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isInitialized).toBe(false)
  })

  it('expone login y logout como funciones', () => {
    const { result } = renderHook(() => useAuth())
    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.logout).toBe('function')
  })
})
