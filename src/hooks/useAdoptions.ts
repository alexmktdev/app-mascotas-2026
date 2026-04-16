/**
 * Hooks de solicitudes de adopción.
 * Lectura → Firestore directo.
 * Escritura → Cloud Functions (solo admins pueden modificar status).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAdoptionRequests,
  fetchAdoptionRequestDetail,
  fetchRecentAdoptionRequests,
} from '@/api/adoptions-firebase'
import {
  functionsCreateAdoptionRequest,
  functionsUpdateAdoptionRequest,
  functionsDeleteAdoptionRequest,
  type CreateAdoptionRequestPayload,
  type UpdateAdoptionRequestPayload,
} from '@/lib/functions'
import { withTimeout } from '@/lib/withTimeout'
import type { AdoptionRequest } from '@/types/firebase.types'
import { DASHBOARD_REFETCH_INTERVAL } from '@/constants'
import toast from 'react-hot-toast'

export function useAdoptionRequests(params: {
  petId?: string
  status?: AdoptionRequest['status']
  page?: number
}) {
  return useQuery({
    queryKey: ['adoption-requests', params],
    queryFn: () => fetchAdoptionRequests(params),
  })
}

export function useAdoptionRequestDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['adoption-request', id],
    queryFn: () => fetchAdoptionRequestDetail(id!),
    enabled: !!id,
  })
}

export function useRecentAdoptionRequests() {
  return useQuery({
    queryKey: ['recent-adoption-requests'],
    queryFn: () => fetchRecentAdoptionRequests(5),
    refetchInterval: DASHBOARD_REFETCH_INTERVAL,
  })
}

// ─── MUTACIONES —van por Cloud Functions ────────────────────────────────────

const ADOPTION_SUBMIT_MS = 90_000
const ADOPTION_UPDATE_MS = 30_000
const ADOPTION_DELETE_MS = 30_000

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

export function useCreateAdoptionRequest() {
  return useMutation({
    mutationFn: (request: CreateAdoptionRequestPayload) =>
      withTimeout(
        functionsCreateAdoptionRequest(request),
        ADOPTION_SUBMIT_MS,
        'Tiempo máximo agotado al enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.',
      ),
    retry: false,
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'Error al enviar solicitud')
      toast.error(msg)
    },
  })
}

export function useUpdateAdoptionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateAdoptionRequestPayload }) =>
      withTimeout(
        functionsUpdateAdoptionRequest({ id, admin_notes: updates.admin_notes, status: updates.status }),
        ADOPTION_UPDATE_MS,
        'Tiempo máximo agotado al guardar cambios de la solicitud. Intenta nuevamente.',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoption-requests'] })
      queryClient.invalidateQueries({ queryKey: ['adoption-request'] })
      queryClient.invalidateQueries({ queryKey: ['recent-adoption-requests'] })
      queryClient.invalidateQueries({ queryKey: ['pet-stats-all'] })
      toast.success('Solicitud actualizada')
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'Error al actualizar solicitud')
      toast.error(msg)
    },
  })
}

export function useDeleteAdoptionRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      withTimeout(
        functionsDeleteAdoptionRequest({ id }),
        ADOPTION_DELETE_MS,
        'Tiempo máximo agotado al eliminar la solicitud. Intenta nuevamente.',
      ),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoption-requests'] })
      queryClient.invalidateQueries({ queryKey: ['adoption-request'] })
      queryClient.invalidateQueries({ queryKey: ['recent-adoption-requests'] })
      queryClient.invalidateQueries({ queryKey: ['pet-stats-all'] })
      toast.success('Solicitud eliminada')
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'Error al eliminar solicitud')
      toast.error(msg)
    },
  })
}