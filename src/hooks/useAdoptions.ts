/**
 * Hooks de solicitudes de adopción con TanStack Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAdoptionRequests,
  fetchAdoptionRequestDetail,
  createAdoptionRequest,
  updateAdoptionRequest,
  fetchRecentAdoptionRequests,
  deleteAdoptionRequest,
} from '@/api/adoptions'
import { withTimeout } from '@/lib/withTimeout'
import type { AdoptionRequestInsert, AdoptionRequestUpdate, AdoptionRequest } from '@/types'
import { DASHBOARD_REFETCH_INTERVAL } from '@/constants'
import toast from 'react-hot-toast'

// ──────────────────────────────────────────────
// Admin: lista de solicitudes
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// Admin: detalle de solicitud
// ──────────────────────────────────────────────

export function useAdoptionRequestDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['adoption-request', id],
    queryFn: () => fetchAdoptionRequestDetail(id!),
    enabled: !!id,
  })
}

// ──────────────────────────────────────────────
// Dashboard: solicitudes recientes
// ──────────────────────────────────────────────

export function useRecentAdoptionRequests() {
  return useQuery({
    queryKey: ['recent-adoption-requests'],
    queryFn: () => fetchRecentAdoptionRequests(5),
    refetchInterval: DASHBOARD_REFETCH_INTERVAL,
  })
}

// ──────────────────────────────────────────────
// Público: crear solicitud (sin auth)
// ──────────────────────────────────────────────

const ADOPTION_SUBMIT_MS = 90_000
const ADOPTION_UPDATE_MS = 30_000
const ADOPTION_DELETE_MS = 30_000

export function useCreateAdoptionRequest() {
  return useMutation({
    mutationFn: (request: AdoptionRequestInsert) =>
      withTimeout(
        createAdoptionRequest(request),
        ADOPTION_SUBMIT_MS,
        'Tiempo máximo agotado al enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.',
      ),
    retry: false,
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error)
      toast.error(`Error al enviar solicitud: ${msg}`)
    },
  })
}

// ──────────────────────────────────────────────
// Admin: actualizar estado de solicitud
// ──────────────────────────────────────────────

export function useUpdateAdoptionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: AdoptionRequestUpdate }) =>
      withTimeout(
        updateAdoptionRequest(id, updates),
        ADOPTION_UPDATE_MS,
        'Tiempo máximo agotado al guardar cambios de la solicitud. Intenta nuevamente.',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoption-requests'] })
      queryClient.invalidateQueries({ queryKey: ['adoption-request'] })
      queryClient.invalidateQueries({ queryKey: ['recent-adoption-requests'] })
      queryClient.invalidateQueries({ queryKey: ['pet-count'] })
      toast.success('Solicitud actualizada')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar solicitud: ${error.message}`)
    },
  })
}

export function useDeleteAdoptionRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      withTimeout(
        deleteAdoptionRequest(id),
        ADOPTION_DELETE_MS,
        'Tiempo máximo agotado al eliminar la solicitud. Intenta nuevamente.',
      ),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoption-requests'] })
      queryClient.invalidateQueries({ queryKey: ['adoption-request'] })
      queryClient.invalidateQueries({ queryKey: ['recent-adoption-requests'] })
      queryClient.invalidateQueries({ queryKey: ['pet-count'] })
      toast.success('Solicitud eliminada')
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error)
      toast.error(`Error al eliminar solicitud: ${msg}`)
    },
  })
}
