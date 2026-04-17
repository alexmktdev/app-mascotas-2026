/**
 * API de adopciones — LECTURA SOLO.
 * Toda escritura (create, update, delete) va por Cloud Functions.
 */

import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firestore'
import type { AdoptionRequest, AdminAdoptionRow, PaginatedResponse } from '@/types/firebase.types'
import { ADMIN_PAGE_SIZE } from '@/constants'

const adoptionsCollection = collection(db, 'adoption_requests')

/** Solicitudes pendientes o en revisión (misma vista que aprobar/rechazar en el panel). */
export async function fetchActionableAdoptionRequestsCount(): Promise<number> {
  const q = query(adoptionsCollection, where('status', 'in', ['pending', 'reviewing']))
  const snap = await getCountFromServer(q)
  return snap.data().count
}

function adoptionFromData(id: string, data: Record<string, unknown>): AdoptionRequest {
  return {
    id,
    pet_id: data.pet_id as string,
    full_name: data.full_name as string,
    email: data.email as string,
    phone: data.phone as string,
    id_number: data.id_number as string,
    address: data.address as string,
    city: data.city as string,
    housing_type: data.housing_type as AdoptionRequest['housing_type'],
    has_yard: data.has_yard as boolean | null,
    has_other_pets: data.has_other_pets as boolean | null,
    other_pets_description: data.other_pets_description as string | null,
    has_children: data.has_children as boolean | null,
    children_ages: data.children_ages as string | null,
    motivation: data.motivation as string,
    experience_with_pets: data.experience_with_pets as string | null,
    work_schedule: data.work_schedule as string | null,
    status: data.status as AdoptionRequest['status'],
    admin_notes: data.admin_notes as string | null,
    reviewed_by: data.reviewed_by as string | null,
    reviewed_at: data.reviewed_at as string | null,
    created_at: data.created_at as string,
  }
}

// ─── SOLO LECTURA ─────────────────────────────────────────────────────────────

export async function fetchAdoptionRequests(params: {
  petId?: string
  status?: AdoptionRequest['status']
  page?: number
}): Promise<PaginatedResponse<AdminAdoptionRow>> {
  const page = params.page ?? 1
  const from = (page - 1) * ADMIN_PAGE_SIZE
  const to = from + ADMIN_PAGE_SIZE - 1

  let q = query(adoptionsCollection, orderBy('created_at', 'desc'))

  if (params.status) {
    q = query(adoptionsCollection, where('status', '==', params.status), orderBy('created_at', 'desc'))
  }

  const snapshot = await getDocs(q)
  let results: AdminAdoptionRow[] = snapshot.docs.map((d) => adoptionFromData(d.id, d.data()))

  const petIds = [...new Set(results.map((r) => r.pet_id))]
  const petNames: Record<string, string> = {}

  await Promise.all(
    petIds.map(async (petId) => {
      try {
        const petDoc = await getDoc(doc(db, 'pets', petId))
        if (petDoc.exists()) {
          petNames[petId] = petDoc.data().name as string
        }
      } catch { /* ignore */ }
    })
  )

  results = results.map((r) => ({
    ...r,
    pet_name: petNames[r.pet_id] ?? null,
  }))

  if (params.petId) {
    results = results.filter((r) => r.pet_id === params.petId)
  }

  const total = results.length
  const pageCount = Math.ceil(total / ADMIN_PAGE_SIZE)
  const paged = results.slice(from, to + 1)

  return { data: paged, total, pageCount }
}

export async function fetchAdoptionRequestDetail(id: string): Promise<AdoptionRequest> {
  const docRef = doc(db, 'adoption_requests', id)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) {
    throw new Error('Solicitud no encontrada')
  }
  return adoptionFromData(docSnap.id, docSnap.data())
}

export async function fetchRecentAdoptionRequests(limitCount: number = 5): Promise<AdminAdoptionRow[]> {
  const q = query(adoptionsCollection, orderBy('created_at', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.slice(0, limitCount).map((d) => adoptionFromData(d.id, d.data()))
}

// ─── ESTAS FUNCIONES YA NO SE USAN — la escritura va por Cloud Functions ─────

export async function createAdoptionRequest(_request: unknown): Promise<never> {
  throw new Error('No llamar directly. Use functionsCreateAdoptionRequest from @/lib/functions')
}

export async function updateAdoptionRequest(_id: string, _updates: unknown): Promise<never> {
  throw new Error('No llamar directly. Use functionsUpdateAdoptionRequest from @/lib/functions')
}

export async function deleteAdoptionRequest(_id: string): Promise<never> {
  throw new Error('No llamar directly. Use functionsDeleteAdoptionRequest from @/lib/functions')
}