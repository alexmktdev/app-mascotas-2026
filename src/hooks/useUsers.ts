/**
 * Hooks de usuarios con TanStack Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchUsers,
  fetchUserById,
  updateUser,
  createUser,
  updateUserAdmin,
  deleteUserAdmin,
} from '@/api/users'
import { withTimeout } from '@/lib/withTimeout'
import type { ProfileUpdate } from '@/types'
import type { UpdateUserAdminPayload, CreateUserPayload } from '@/api/users'
import toast from 'react-hot-toast'

// ──────────────────────────────────────────────
// Admin: lista de usuarios
// ──────────────────────────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })
}

// ──────────────────────────────────────────────
// Admin: un usuario
// ──────────────────────────────────────────────

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => fetchUserById(id!),
    enabled: Boolean(id),
  })
}

// ──────────────────────────────────────────────
// Admin: actualizar perfil de usuario (parcial, cliente)
// ──────────────────────────────────────────────

const USERS_MUTATION_MS = 60_000

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ProfileUpdate }) =>
      withTimeout(
        updateUser(id, updates),
        USERS_MUTATION_MS,
        'Tiempo máximo agotado al actualizar usuario. Intenta nuevamente.',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario actualizado')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar usuario: ${error.message}`)
    },
  })
}

// ──────────────────────────────────────────────
// Admin: editar usuario completo (Edge Function)
// ──────────────────────────────────────────────

export function useAdminUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateUserAdminPayload) =>
      withTimeout(
        updateUserAdmin(payload),
        USERS_MUTATION_MS,
        'Tiempo máximo agotado al guardar cambios de usuario. Intenta nuevamente.',
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users', variables.user_id] })
      toast.success('Usuario actualizado')
    },
    onError: (error: Error) => {
      toast.error(`Error al guardar usuario: ${error.message}`)
    },
  })
}

// ──────────────────────────────────────────────
// Admin: eliminar usuario (Edge Function)
// ──────────────────────────────────────────────

export function useAdminDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      withTimeout(
        deleteUserAdmin(userId),
        USERS_MUTATION_MS,
        'Tiempo máximo agotado al eliminar usuario. Intenta nuevamente.',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario eliminado')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar usuario: ${error.message}`)
    },
  })
}

// ──────────────────────────────────────────────
// Admin: crear usuario (vía Edge Function)
// ──────────────────────────────────────────────

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      withTimeout(
        createUser(payload),
        USERS_MUTATION_MS,
        'Tiempo máximo agotado al crear usuario. Intenta nuevamente.',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario creado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al crear usuario: ${error.message}`)
    },
  })
}
