/**
 * Hooks de mascotas.
 * Lectura → Firestore directo (solo consulta, seguro).
 * Escritura → Cloud Functions (valida roles, lógica de negocio).
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  fetchPublicPets,
  fetchPetDetail,
  fetchAdminPets,
  fetchAllPetStats,
} from '@/api/pets-firebase'
import {
  functionsCreatePet,
  functionsUpdatePet,
  functionsDeletePet,
  functionsUploadPetPhoto,
  type CreatePetPayload,
  type UpdatePetPayload,
} from '@/lib/functions'
import { withTimeout } from '@/lib/withTimeout'
import type { PetFilters, AdminPetFilters } from '@/types/firebase.types'
import type { FetchPetDetailOptions } from '@/api/pets-firebase'
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

export function usePets(filters: PetFilters) {
  return useQuery({
    queryKey: ['pets', filters],
    queryFn: () => fetchPublicPets(filters),
    placeholderData: keepPreviousData,
  })
}

export function usePetDetail(id: string | undefined, options?: FetchPetDetailOptions) {
  const visibility = options?.visibility ?? 'all'
  return useQuery({
    queryKey: ['pet', id, visibility],
    queryFn: () => fetchPetDetail(id!, options),
    enabled: !!id,
  })
}

export function useAdminPets(filters: AdminPetFilters) {
  return useQuery({
    queryKey: ['admin-pets', filters],
    queryFn: () => fetchAdminPets(filters),
  })
}

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

// ─── MUTACIONES —van por Cloud Functions ────────────────────────────────────

const CREATE_PET_DEADLINE_MS = 150_000
const UPDATE_PET_DEADLINE_MS = 90_000
const DELETE_PET_DEADLINE_MS = 30_000

export function useCreatePet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePetPayload) =>
      withTimeout(
        functionsCreatePet(data),
        CREATE_PET_DEADLINE_MS,
        'Tiempo máximo agotado al registrar la mascota. Revisa la red e intenta de nuevo.',
      ),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pets'] })
      queryClient.invalidateQueries({ queryKey: ['pet-stats-all'] })
      toast.success('Mascota registrada exitosamente')
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'No se pudo registrar la mascota.')
      if (/tiempo máximo agotado/i.test(msg)) {
        toast.error(msg)
        return
      }
      toast.error(`Error al registrar mascota: ${msg}`)
    },
  })
}

export function useUpdatePet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePetPayload }) =>
      withTimeout(
        functionsUpdatePet({ id, ...updates }),
        UPDATE_PET_DEADLINE_MS,
        'Tiempo máximo agotado al actualizar la mascota. Revisa la conexión e intenta de nuevo.',
      ),
    onSuccess: (data: { success: boolean }, _vars, _ctx) => {
      if (!data.success) return
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pets'] })
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
    mutationFn: ({ id }: { id: string }) =>
      withTimeout(
        functionsDeletePet({ id }),
        DELETE_PET_DEADLINE_MS,
        'Tiempo máximo agotado al eliminar mascota. Intenta nuevamente.',
      ),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      queryClient.invalidateQueries({ queryKey: ['admin-pets'] })
      queryClient.invalidateQueries({ queryKey: ['pet-stats-all'] })
      toast.success('Mascota eliminada')
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'No se pudo eliminar la mascota.')
      if (/tiempo máximo agotado/i.test(msg)) {
        toast.error(msg)
        return
      }
      toast.error(`Error al eliminar mascota: ${msg}`)
    },
  })
}

// ─── FOTOS —van por Cloud Functions ────────────────────────────────────────

export async function uploadPetPhotoToCloud(petId: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      try {
        const result = await functionsUploadPetPhoto({ petId, photoDataUrl: base64 })
        resolve(result.url)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsDataURL(file)
  })
}