/**
 * Hook de autenticación — wrapper sobre el store de Zustand.
 */

import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const {
    user,
    profile,
    isLoading,
    isInitialized,
    login,
    logout,
  } = useAuthStore()

  return {
    user,
    profile,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    isStaff: profile?.role === 'staff',
    login,
    logout,
  }
}
