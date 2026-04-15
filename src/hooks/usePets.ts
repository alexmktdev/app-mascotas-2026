/**
 * Hooks de mascotas con TanStack Query.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  fetchPublicPets,
  fetchPetDetail,
  fetchAdminPets,
  fetchAllPetStats,
  createPet,
  updatePet,
  deletePet,
} from '@/api/pets'
import { deletePetPhotos } from '@/api/petPhotosStorage'
import { withTimeout } from '@/lib/withTimeout'
import type { PetFilters, AdminPetFilters, PetInsert, PetUpdate, Pet } from '@/types'
import { DASHBOARD_REFETCH_INTERVAL } from '@/constants'
import toast from 'react-hot-toast'

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

// ──────────────────────────────────────────────
// Público: lista de mascotas con filtros
// ──────────────────────────────────────────────

export function usePets(filters: PetFilters) {
  const FETCH_TIMEOUT_MS = 15_000

  return useQuery({
    queryKey: ['pets', filters],
    queryFn: () =>
      withTimeout(
        fetchPublicPets(filters),
        FETCH_TIMEOUT_MS,
        'La galería está tardando más de lo habitual. Por favor, revisa tu conexión o intenta recargar la página.',
      ),
    placeholderData: keepPreviousData,
  })
}

// ──────────────────────────────────────────────
// Público: detalle de mascota
// ──────────────────────────────────────────────

export function usePetDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['pet', id],
    queryFn: () => fetchPetDetail(id!),
    enabled: !!id,
  })
}

// ──────────────────────────────────────────────
// Admin: mascotas por estado
// ──────────────────────────────────────────────

export function useAdminPets(filters: AdminPetFilters) {
  return useQuery({
    queryKey: ['admin-pets', filters],
    queryFn: () => fetchAdminPets(filters),
  })
}

// ──────────────────────────────────────────────
// Dashboard: contadores
// ──────────────────────────────────────────────

export function usePetStats() {
  const statsQuery = useQuery({
    queryKey: ['pet-stats-all'],
    queryFn: () => fetchAllPetStats(),
    refetchInterval: DASHBOARD_REFETCH_INTERVAL,
  })

  return {
    stats: {
      available: statsQuery.data?.available ?? 0,
      inProcess: statsQuery.data?.inProcess ?? 0,
      adopted: statsQuery.data?.adopted ?? 0,
    },
    isLoading: statsQuery.isLoading,
  }
}

// ──────────────────────────────────────────────
// Mutaciones
// ──────────────────────────────────────────────

/** 2 fotos en secuencia (subida lenta) + insert; debe ser mayor que 2×timeout de red + insert. */
const CREATE_PET_DEADLINE_MS = 150_000

export function useCreatePet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pet: PetInsert) =>
      withTimeout(
        createPet(pet),
        CREATE_PET_DEADLINE_MS,
        'Tiempo máximo agotado al registrar la mascota. Revisa la red, Supabase y las políticas RLS; vuelve a intentar.',
      ),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pets'] })
      queryClient.invalidateQueries({ queryKey: ['pet-stats-all'] })
      toast.success('Mascota registrada exitosamente')
    },
    onError: (error: unknown) => {
      console.error('[useCreatePet] Error completo:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        code: (error as { code?: string })?.code,
        details: (error as { details?: string })?.details,
        hint: (error as { hint?: string })?.hint,
        stack: error instanceof Error ? error.stack : undefined,
      })
      const name =
        (error instanceof Error && error.name) ||
        (error && typeof error === 'object' && typeof (error as { name?: unknown }).name === 'string'
          ? (error as { name: string }).name
          : '')
      const msg = getErrorMessage(error, 'No se pudo registrar la mascota.')
      if (name === 'AbortError' || /aborted|abort/i.test(msg)) {
        toast.error(
          'La petición tardó demasiado o se canceló. Comprueba tu red, que el proyecto Supabase esté activo y vuelve a intentarlo.',
        )
        return
      }
      if (/tiempo máximo agotado|Tiempo máximo agotado/i.test(msg)) {
        toast.error(msg)
        return
      }
      toast.error(`Error al registrar mascota: ${msg}`)
    },
  })
}

const UPDATE_PET_DEADLINE_MS = 90_000
const DELETE_PET_DEADLINE_MS = 30_000

export function useUpdatePet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PetUpdate }) =>
      withTimeout(
        updatePet(id, updates),
        UPDATE_PET_DEADLINE_MS,
        'Tiempo máximo agotado al actualizar la mascota. Revisa la conexión e inténtalo de nuevo.',
      ),
    onSuccess: (data: Pet) => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pets'] })
      queryClient.invalidateQueries({ queryKey: ['pet', data.id] })
      queryClient.invalidateQueries({ queryKey: ['pet-stats-all'] })
      toast.success('Mascota actualizada exitosamente')
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'No se pudo actualizar la mascota.')
      if (/tiempo máximo agotado/i.test(msg)) {
        toast.error(msg)
        return
      }
      toast.error(`Error al actualizar mascota: ${msg}`)
    },
  })
}

export function useDeletePet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, photoUrls }: { id: string; photoUrls: string[] }) => {
      // 1. Intentar borrar fotos primero
      if (photoUrls.length > 0) {
        await deletePetPhotos(photoUrls)
      }

      // 2. Borrar registro en DB
      return withTimeout(
        deletePet(id),
        DELETE_PET_DEADLINE_MS,
        'Tiempo máximo agotado al eliminar mascota. Intenta nuevamente.',
      )
    },
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pets'] })
      queryClient.invalidateQueries({ queryKey: ['pet-stats-all'] })
      toast.success('Mascota eliminada')
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'No se pudo eliminar la mascota.')
      const aborted =
        (typeof DOMException !== 'undefined' &&
          error instanceof DOMException &&
          error.name === 'AbortError') ||
        (error instanceof Error && error.name === 'AbortError')
      if (aborted) {
        toast.error(
          'La petición tardó demasiado o se canceló. Revisa tu red o recarga la página e inténtalo de nuevo.',
        )
        return
      }
      toast.error(`Error al eliminar mascota: ${msg}`)
    },
  })
}
