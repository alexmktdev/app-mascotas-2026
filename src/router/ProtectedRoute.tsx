/**
 * Guard de rutas protegidas.
 * - Sin sesión: redirect a /login
 * - Sin rol autorizado: redirect a /unauthorized
 * - Loading: skeleton (no flash de login)
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Profile } from '@/types/firebase.types'
import { Skeleton } from '@/components/ui/Skeleton'

interface ProtectedRouteProps {
  allowedRoles?: Profile['role'][]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isInitialized, profile } = useAuth()

  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="w-full max-w-md space-y-4 p-8">
          <Skeleton className="mx-auto h-12 w-12 !rounded-full" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles?.length) {
    if (!profile) {
      return <Navigate to="/unauthorized" replace />
    }
    if (!allowedRoles.includes(profile.role)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return <Outlet />
}
