/**
 * Tests del authStore (Firebase) — estado inicial y forma pública del store.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      profile: null,
      isLoading: true,
      isInitialized: false,
    })
  })

  it('estado inicial: user y profile null', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.profile).toBeNull()
  })

  it('expone initialize, login y logout', () => {
    const state = useAuthStore.getState()
    expect(typeof state.initialize).toBe('function')
    expect(typeof state.login).toBe('function')
    expect(typeof state.logout).toBe('function')
  })

  it('no tiene clave session (solo Firebase User)', () => {
    const state = useAuthStore.getState() as Record<string, unknown>
    expect('session' in state ? state.session : undefined).toBeUndefined()
  })
})
