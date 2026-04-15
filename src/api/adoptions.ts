/**
 * API de solicitudes de adopción — Funciones que llaman a Supabase.
 */

import { supabase } from '@/lib/supabase'
import type {
  AdoptionRequest,
  AdoptionRequestAdminRow,
  AdoptionRequestInsert,
  AdoptionRequestUpdate,
  PaginatedResponse,
} from '@/types'
import { ADMIN_PAGE_SIZE } from '@/constants'

// ──────────────────────────────────────────────
// Campos seleccionados por vista
// ──────────────────────────────────────────────

/** Antes solo 6 columnas: el modal admin mostraba datos vacíos o incorrectos. Incluye todo el formulario público + pets(name). */
const ADMIN_LIST_SELECT = [
  'id',
  'pet_id',
  'full_name',
  'email',
  'phone',
  'id_number',
  'address',
  'city',
  'housing_type',
  'has_yard',
  'has_other_pets',
  'other_pets_description',
  'has_children',
  'children_ages',
  'motivation',
  'experience_with_pets',
  'work_schedule',
  'status',
  'admin_notes',
  'reviewed_by',
  'reviewed_at',
  'created_at',
  'pets ( name )',
].join(', ')

const DETAIL_FIELDS = '*' as const

function mapAdoptionAdminRow(raw: Record<string, unknown>): AdoptionRequestAdminRow {
  const pets = raw.pets as { name?: string } | null | undefined
  const { pets: _p, ...rest } = raw
  return {
    ...(rest as AdoptionRequest),
    pet_name: pets?.name ?? null,
  }
}

// ──────────────────────────────────────────────
// Público: crear solicitud de adopción (sin auth)
// ──────────────────────────────────────────────

/**
 * Solo INSERT, sin .select(): el rol anónimo no tiene política SELECT en adoption_requests
 * (solo staff autenticado). Un insert().select() intenta devolver la fila y puede fallar,
 * devolver vacío o dejar la petición colgada según PostgREST/RLS.
 */
export async function createAdoptionRequest(request: AdoptionRequestInsert): Promise<void> {
  const { error } = await supabase.from('adoption_requests').insert(request)

  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('Demasiadas solicitudes')) {
      throw new Error(
        'Has enviado varias solicitudes recientes para esta mascota. Espera al menos una hora o contáctanos.',
      )
    }
    if (error.code === '42501' || msg.toLowerCase().includes('row-level security')) {
      throw new Error(
        'No se pudo registrar la solicitud. Es posible que la mascota ya no esté disponible.',
      )
    }
    throw error
  }
}

// ──────────────────────────────────────────────
// Admin: listar solicitudes (opcionalmnete filtradas por mascota)
// ──────────────────────────────────────────────

export async function fetchAdoptionRequests(params: {
  petId?: string
  status?: AdoptionRequest['status']
  page?: number
}): Promise<PaginatedResponse<AdoptionRequestAdminRow>> {
  const page = params.page ?? 1
  const from = (page - 1) * ADMIN_PAGE_SIZE
  const to = from + ADMIN_PAGE_SIZE - 1

  let query = supabase
    .from('adoption_requests')
    .select(ADMIN_LIST_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.petId) query = query.eq('pet_id', params.petId)
  if (params.status) query = query.eq('status', params.status)

  const { data, error, count } = await query

  if (error) throw error
  const rows = (data ?? []).map((row) => mapAdoptionAdminRow(row as unknown as Record<string, unknown>))
  return {
    data: rows,
    total: count ?? 0,
    pageCount: Math.ceil((count ?? 0) / ADMIN_PAGE_SIZE),
  }
}

// ──────────────────────────────────────────────
// Admin: detalle de una solicitud
// ──────────────────────────────────────────────

export async function fetchAdoptionRequestDetail(id: string): Promise<AdoptionRequest> {
  const { data, error } = await supabase
    .from('adoption_requests')
    .select(DETAIL_FIELDS)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ──────────────────────────────────────────────
// Admin: actualizar estado de solicitud
// ──────────────────────────────────────────────

export async function updateAdoptionRequest(
  id: string,
  updates: AdoptionRequestUpdate
): Promise<AdoptionRequest> {
  const { data, error } = await supabase
    .from('adoption_requests')
    .update(updates)
    .eq('id', id)
    .select(DETAIL_FIELDS)
    .single()

  if (error) throw error
  return data
}

export async function deleteAdoptionRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from('adoption_requests')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ──────────────────────────────────────────────
// Admin: solicitudes recientes (para dashboard)
// ──────────────────────────────────────────────

export async function fetchRecentAdoptionRequests(
  limit: number = 5
): Promise<AdoptionRequestAdminRow[]> {
  const { data, error } = await supabase
    .from('adoption_requests')
    .select(ADMIN_LIST_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((row) => mapAdoptionAdminRow(row as unknown as Record<string, unknown>))
}
