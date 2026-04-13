/**
 * Componente raíz de la aplicación.
 * Configura providers: QueryClient, Router, Toast, ErrorBoundary.
 * Inicializa la sesión de auth al montar.
 */

import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router'
import { useAuthStore } from '@/store/authStore'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
