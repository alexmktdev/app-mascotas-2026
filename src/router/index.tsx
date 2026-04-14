/**
 * Definición centralizada de rutas.
 * Todas las páginas usan React.lazy + Suspense para code splitting.
 */

import React, { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { Skeleton } from '@/components/ui/Skeleton'

// ──────────────────────────────────────────────
// Lazy imports (code splitting por ruta)
// ──────────────────────────────────────────────

const Home = React.lazy(() => import('@/pages/public/Home'))
const PetDetail = React.lazy(() => import('@/pages/public/PetDetail'))
const AdoptionForm = React.lazy(() => import('@/pages/public/AdoptionForm'))
const Login = React.lazy(() => import('@/pages/public/Login'))

const Dashboard = React.lazy(() => import('@/pages/admin/Dashboard'))
const AdminPetsList = React.lazy(() => import('@/pages/admin/PetsList'))
const AddPet = React.lazy(() => import('@/pages/admin/AddPet'))
const EditPet = React.lazy(() => import('@/pages/admin/EditPet'))
const InProcess = React.lazy(() => import('@/pages/admin/InProcess'))
const Adopted = React.lazy(() => import('@/pages/admin/Adopted'))
const UsersList = React.lazy(() => import('@/pages/admin/UsersList'))
const CreateUser = React.lazy(() => import('@/pages/admin/CreateUser'))
const EditUser = React.lazy(() => import('@/pages/admin/EditUser'))
const ResetPassword = React.lazy(() => import('@/pages/public/ResetPassword'))
const NotFound = React.lazy(() => import('@/pages/public/NotFound'))
const Unauthorized = React.lazy(() => import('@/pages/public/Unauthorized'))

// ──────────────────────────────────────────────
// Fallback de carga
// ──────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="w-full max-w-md space-y-4 p-8">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

// ──────────────────────────────────────────────
// Router
// ──────────────────────────────────────────────

export const router = createBrowserRouter([
  // Rutas públicas
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: <SuspenseWrapper><Home /></SuspenseWrapper>,
      },
      {
        path: '/pets/:id',
        element: <SuspenseWrapper><PetDetail /></SuspenseWrapper>,
      },
      {
        path: '/adopt/:petId',
        element: <SuspenseWrapper><AdoptionForm /></SuspenseWrapper>,
      },
      {
        path: '/login',
        element: <SuspenseWrapper><Login /></SuspenseWrapper>,
      },
      {
        path: '/unauthorized',
        element: <SuspenseWrapper><Unauthorized /></SuspenseWrapper>,
      },
      {
        path: '/reset-password',
        element: <SuspenseWrapper><ResetPassword /></SuspenseWrapper>,
      },
      {
        path: '*',
        element: <SuspenseWrapper><NotFound /></SuspenseWrapper>,
      },
    ],
  },

  // Rutas admin (protegidas: staff + admin)
  {
    element: <ProtectedRoute allowedRoles={['admin', 'staff']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: '/admin',
            element: <SuspenseWrapper><Dashboard /></SuspenseWrapper>,
          },
          {
            path: '/admin/pets',
            element: <SuspenseWrapper><AdminPetsList /></SuspenseWrapper>,
          },
          {
            path: '/admin/pets/new',
            element: <SuspenseWrapper><AddPet /></SuspenseWrapper>,
          },
          {
            path: '/admin/pets/:id/edit',
            element: <SuspenseWrapper><EditPet /></SuspenseWrapper>,
          },
          {
            path: '/admin/in-process',
            element: <SuspenseWrapper><InProcess /></SuspenseWrapper>,
          },
          {
            path: '/admin/adopted',
            element: <SuspenseWrapper><Adopted /></SuspenseWrapper>,
          },
        ],
      },
    ],
  },

  // Rutas solo admin
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: '/admin/users',
            element: <SuspenseWrapper><UsersList /></SuspenseWrapper>,
          },
          {
            path: '/admin/users/new',
            element: <SuspenseWrapper><CreateUser /></SuspenseWrapper>,
          },
          {
            path: '/admin/users/:id/edit',
            element: <SuspenseWrapper><EditUser /></SuspenseWrapper>,
          },
        ],
      },
    ],
  },
])
