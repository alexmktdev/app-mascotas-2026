/**
 * Tests de integración para useAuth (Firebase + Zustand).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@/types/firebase.types'

function mockFirebaseUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'user-123',
    email: 'test@test.com',
    emailVerified: true,
    isAnonymous: false,
    metadata: {} as User['metadata'],
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'token',
    getIdTokenResult: async () => ({} as never),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    photoURL: null,
    displayName: null,
    providerId: 'firebase',
    ...overrides,
  } as User
}

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: true,
    })
  })

  it('isAuthenticated es false sin usuario', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('isAuthenticated es true con user en el store', () => {
    useAuthStore.setState({ user: mockFirebaseUser() })
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('isAdmin es true con profile.role = admin', () => {
    const profile: Profile = {
      id: 'user-123',
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@test.com',
      role: 'admin',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    useAuthStore.setState({
      user: mockFirebaseUser(),
      profile,
    })

    const { result } = renderHook(() => useAuth())
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isStaff).toBe(false)
  })

  it('isStaff es true con profile.role = staff', () => {
    const profile: Profile = {
      id: 'user-456',
      first_name: 'Staff',
      last_name: 'User',
      email: 'staff@test.com',
      role: 'staff',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    useAuthStore.setState({
      user: mockFirebaseUser({ uid: 'user-456' }),
      profile,
    })

    const { result } = renderHook(() => useAuth())
    expect(result.current.isStaff).toBe(true)
    expect(result.current.isAdmin).toBe(false)
  })

  it('isAdmin y isStaff son false sin profile', () => {
    useAuthStore.setState({ user: mockFirebaseUser(), profile: null })
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
