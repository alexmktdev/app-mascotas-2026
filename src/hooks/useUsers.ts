/**
 * Hooks de usuarios.
 * Lectura → Firestore directo.
 * Escritura → Cloud Functions (solo admins).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchUsers,
  fetchUserById,
} from '@/api/users-firebase'
import {
  functionsCreateUser,
  functionsUpdateUser,
  functionsDeleteUser,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/lib/functions'
import { withTimeout } from '@/lib/withTimeout'
import toast from 'react-hot-toast'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => fetchUserById(id!),
    enabled: Boolean(id),
  })
}

// ─── MUTACIONES —van por Cloud Functions ────────────────────────────────────

const USERS_MUTATION_MS = 60_000

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message?.trim()) return error.message
  if (typeof error === 'string' && error.trim()) return error
  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>
    const preferred = [candidate.message, candidate.error_description, candidate.details, candidate.hint]
      .find((v) => typeof v === 'string' && v.trim()) as string | undefined
    if (preferred) return preferred
  }
  return fallback
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Omit<UpdateUserPayload, 'uid'> }) =>
      withTimeout(
        functionsUpdateUser({ uid: id, ...updates }),
        USERS_MUTATION_MS,
        'Tiempo máximo agotado al actualizar usuario. Intenta nuevamente.',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario actualizado')
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'Error al actualizar usuario')
      toast.error(msg)
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      withTimeout(
        functionsCreateUser(payload),
        USERS_MUTATION_MS,
        'Tiempo máximo agotado al crear usuario. Intenta nuevamente.',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario creado exitosamente')
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'Error al crear usuario')
      toast.error(msg)
    },
  })
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      withTimeout(
        functionsDeleteUser({ uid: userId }),
        USERS_MUTATION_MS,
        'Tiempo máximo agotado al eliminar usuario. Intenta nuevamente.',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario eliminado')
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'Error al eliminar usuario')
      toast.error(msg)
    },
  })
}