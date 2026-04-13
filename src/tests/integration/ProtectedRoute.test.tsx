/**
 * Tests de integración para src/router/ProtectedRoute.tsx
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/router/ProtectedRoute'
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

/** Helper para renderizar ProtectedRoute dentro de un router de prueba */
function renderProtected(opts: {
  allowedRoles?: string[]
  initialPath?: string
}) {
  const routes = [
    {
      element: <ProtectedRoute allowedRoles={opts.allowedRoles as never} />,
      children: [
        {
          path: '/admin',
          element: <div>Admin Dashboard</div>,
        },
      ],
    },
    {
      path: '/login',
      element: <div>Login Page</div>,
    },
    {
      path: '/unauthorized',
      element: <div>Unauthorized Page</div>,
    },
  ]

  const router = createMemoryRouter(routes, {
    initialEntries: [opts.initialPath ?? '/admin'],
  })

  return render(<RouterProvider router={router} />)
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: true,
    })
  })

  it('redirige a /login cuando no hay sesión', async () => {
    renderProtected({ allowedRoles: ['admin', 'staff'] })
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('redirige a /unauthorized cuando el usuario no tiene el rol requerido', async () => {
    useAuthStore.setState({
      session: mockSession(),
      user: mockUser(),
      profile: {
        id: 'user-123',
        first_name: 'Staff',
        last_name: 'User',
        email: 'staff@test.com',
        role: 'staff',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    })

    renderProtected({ allowedRoles: ['admin'] })
    expect(await screen.findByText('Unauthorized Page')).toBeInTheDocument()
  })

  it('redirige a /unauthorized cuando hay sesión pero no profile', async () => {
    useAuthStore.setState({
      session: mockSession(),
      user: mockUser(),
      profile: null,
    })

    renderProtected({ allowedRoles: ['admin'] })
    expect(await screen.findByText('Unauthorized Page')).toBeInTheDocument()
  })

  it('renderiza children cuando el usuario tiene el rol correcto', async () => {
    useAuthStore.setState({
      session: mockSession(),
      user: mockUser(),
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

    renderProtected({ allowedRoles: ['admin', 'staff'] })
    expect(await screen.findByText('Admin Dashboard')).toBeInTheDocument()
  })

  it('muestra skeleton mientras está cargando', () => {
    useAuthStore.setState({
      isLoading: true,
      isInitialized: false,
    })

    const { container } = renderProtected({ allowedRoles: ['admin'] })
    // Debe mostrar skeletons, no redirect
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument()
    expect(container.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('renderiza children cuando no se especifican allowedRoles', async () => {
    useAuthStore.setState({
      session: mockSession(),
      user: mockUser(),
      profile: {
        id: 'user-123',
        first_name: 'User',
        last_name: 'Test',
        email: 'user@test.com',
        role: 'staff',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    })

    renderProtected({})
    expect(await screen.findByText('Admin Dashboard')).toBeInTheDocument()
  })
})
