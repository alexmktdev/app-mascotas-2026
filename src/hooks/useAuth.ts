/**
 * Hook de autenticación — wrapper sobre el store de Zustand.
 */

import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const {
    session,
    user,
    profile,
    isLoading,
    isInitialized,
    login,
    logout,
  } = useAuthStore()

  return {
    session,
    user,
    profile,
    isLoading,
    isInitialized,
    isAuthenticated: !!session,
    isAdmin: profile?.role === 'admin',
    isStaff: profile?.role === 'staff',
    login,
    logout,
  }
}
