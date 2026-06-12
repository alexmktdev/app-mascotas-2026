import 'server-only'

import { unstable_cache } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import { writeAuditLog } from '@/server/audit'
import { ActionError } from '@/server/errors'
import { ADMIN_PAGE_SIZE } from '@/constants'
import type { AdminAdoptionRow, AdoptionRequest, PaginatedResponse } from '@/types/firebase.types'

const adoptionsCollection = () => adminDb.collection('adoption_requests')
const petsCollection = () => adminDb.collection('pets')

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
    housing_type: (data.housing_type as AdoptionRequest['housing_type']) ?? null,
    has_yard: (data.has_yard as boolean | null) ?? null,
    has_other_pets: (data.has_other_pets as boolean | null) ?? null,
    other_pets_description: (data.other_pets_description as string | null) ?? null,
    has_children: (data.has_children as boolean | null) ?? null,
    children_ages: (data.children_ages as string | null) ?? null,
    motivation: data.motivation as string,
    experience_with_pets: (data.experience_with_pets as string | null) ?? null,
    work_schedule: (data.work_schedule as string | null) ?? null,
    status: data.status as AdoptionRequest['status'],
    admin_notes: (data.admin_notes as string | null) ?? null,
    reviewed_by: (data.reviewed_by as string | null) ?? null,
    reviewed_at: (data.reviewed_at as string | null) ?? null,
    created_at: data.created_at as string,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// LECTURA
// ─────────────────────────────────────────────────────────────────────────

export const fetchActionableAdoptionRequestsCount = unstable_cache(
  fetchActionableAdoptionRequestsCountUncached,
  ['fetch-actionable-adoption-requests-count'],
  { revalidate: 30, tags: ['adoptions'] },
)

async function fetchActionableAdoptionRequestsCountUncached(): Promise<number> {
  const snap = await adoptionsCollection().where('status', 'in', ['pending', 'reviewing']).count().get()
  return snap.data().count
}

export const fetchAdoptionRequests = unstable_cache(
  fetchAdoptionRequestsUncached,
  ['fetch-adoption-requests'],
  { revalidate: 30, tags: ['adoptions'] },
)

async function fetchAdoptionRequestsUncached(params: {
  petId?: string
  status?: AdoptionRequest['status'] | AdoptionRequest['status'][]
  page?: number
}): Promise<PaginatedResponse<AdminAdoptionRow>> {
  const page = params.page ?? 1
  const from = (page - 1) * ADMIN_PAGE_SIZE
  const to = from + ADMIN_PAGE_SIZE

  // Nota: `where('status', 'in', [...])` combinado con `orderBy('created_at')` requiere
  // un índice compuesto en Firestore. Para evitar depender de índices manuales, en ese
  // caso se omite el orderBy en la consulta y se ordena en memoria.
  let q: FirebaseFirestore.Query = adoptionsCollection().orderBy('created_at', 'desc')
  let sortInMemory = false
  if (params.status) {
    if (Array.isArray(params.status)) {
      q = adoptionsCollection().where('status', 'in', params.status)
      sortInMemory = true
    } else {
      q = adoptionsCollection().where('status', '==', params.status).orderBy('created_at', 'desc')
    }
  }

  const snapshot = await q.get()
  let results: AdminAdoptionRow[] = snapshot.docs.map((d) => adoptionFromData(d.id, d.data()))
  if (sortInMemory) {
    results = results.sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
  }

  const petIds = [...new Set(results.map((r) => r.pet_id))]
  const petNames: Record<string, string> = {}

  await Promise.all(
    petIds.map(async (petId) => {
      try {
        const petDoc = await petsCollection().doc(petId).get()
        if (petDoc.exists) {
          petNames[petId] = petDoc.data()?.name as string
        }
      } catch {
        // ignore
      }
    }),
  )

  results = results.map((r) => ({ ...r, pet_name: petNames[r.pet_id] ?? null }))

  if (params.petId) {
    results = results.filter((r) => r.pet_id === params.petId)
  }

  const total = results.length
  const pageCount = Math.ceil(total / ADMIN_PAGE_SIZE)
  const paged = results.slice(from, to)

  return { data: paged, total, pageCount }
}

export const fetchAdoptionRequestDetail = unstable_cache(
  fetchAdoptionRequestDetailUncached,
  ['fetch-adoption-request-detail'],
  { revalidate: 30, tags: ['adoptions'] },
)

async function fetchAdoptionRequestDetailUncached(id: string): Promise<AdoptionRequest | null> {
  const snap = await adoptionsCollection().doc(id).get()
  if (!snap.exists) return null
  return adoptionFromData(snap.id, snap.data()!)
}

export const fetchRecentAdoptionRequests = unstable_cache(
  fetchRecentAdoptionRequestsUncached,
  ['fetch-recent-adoption-requests'],
  { revalidate: 30, tags: ['adoptions'] },
)

async function fetchRecentAdoptionRequestsUncached(limitCount: number = 5): Promise<AdminAdoptionRow[]> {
  const snapshot = await adoptionsCollection().orderBy('created_at', 'desc').limit(limitCount).get()
  return snapshot.docs.map((d) => adoptionFromData(d.id, d.data()))
}

// ─────────────────────────────────────────────────────────────────────────
// ESCRITURA — port 1:1 de functions/src/index.ts (createAdoptionRequest,
// updateAdoptionRequest, deleteAdoptionRequest), incluyendo la sincronización
// del estado de la mascota (pets.status).
// ─────────────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['pet_id', 'full_name', 'email', 'phone', 'id_number', 'address', 'city', 'motivation'] as const

export async function createAdoptionRequestRecord(requestData: Record<string, unknown>): Promise<{ id: string }> {
  for (const field of REQUIRED_FIELDS) {
    if (!requestData[field]) {
      throw new ActionError('invalid-argument', `Campo requerido faltante: ${field}`)
    }
  }

  const petRef = petsCollection().doc(requestData.pet_id as string)
  const petSnap = await petRef.get()
  if (!petSnap.exists) {
    throw new ActionError('not-found', 'Mascota no encontrada')
  }

  const petData = petSnap.data()
  if (petData?.status !== 'available') {
    throw new ActionError('failed-precondition', 'Esta mascota ya no está disponible para adopción')
  }

  const now = new Date().toISOString()

  const validated = {
    pet_id: (requestData.pet_id as string).trim(),
    full_name: (requestData.full_name as string).trim(),
    email: (requestData.email as string).trim().toLowerCase(),
    phone: (requestData.phone as string).trim(),
    id_number: (requestData.id_number as string).trim(),
    address: (requestData.address as string).trim(),
    city: (requestData.city as string).trim(),
    housing_type: ['house', 'apartment', 'farm', 'other'].includes(String(requestData.housing_type))
      ? (String(requestData.housing_type) as 'house' | 'apartment' | 'farm' | 'other')
      : null,
    has_yard: requestData.has_yard != null ? Boolean(requestData.has_yard) : null,
    has_other_pets: requestData.has_other_pets != null ? Boolean(requestData.has_other_pets) : null,
    other_pets_description: requestData.other_pets_description
      ? (requestData.other_pets_description as string).trim() || null
      : null,
    has_children: requestData.has_children != null ? Boolean(requestData.has_children) : null,
    children_ages: requestData.children_ages ? (requestData.children_ages as string).trim() || null : null,
    motivation: (requestData.motivation as string).trim(),
    experience_with_pets: requestData.experience_with_pets
      ? (requestData.experience_with_pets as string).trim() || null
      : null,
    work_schedule: requestData.work_schedule ? (requestData.work_schedule as string).trim() || null : null,
    status: 'pending' as const,
    admin_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: now,
  }

  const requestRef = adoptionsCollection().doc()
  await requestRef.set({ ...validated, id: requestRef.id })

  await petRef.update({ status: 'in_process', updated_at: now })

  return { id: requestRef.id }
}

export async function updateAdoptionRequestRecord(
  uid: string,
  id: string,
  changes: { admin_notes?: string; status?: string },
): Promise<void> {
  const { admin_notes, status } = changes

  if (!status && admin_notes === undefined) {
    throw new ActionError('invalid-argument', 'Debe proporcionar status o admin_notes')
  }

  const requestRef = adoptionsCollection().doc(id)
  const requestSnap = await requestRef.get()
  if (!requestSnap.exists) {
    throw new ActionError('not-found', 'Solicitud no encontrada')
  }

  const existing = requestSnap.data()
  const existingStatus = existing?.status ?? 'pending'
  const now = new Date().toISOString()

  const updateData: Record<string, unknown> = {
    reviewed_by: uid,
    reviewed_at: now,
  }
  if (admin_notes !== undefined) updateData.admin_notes = admin_notes
  if (status !== undefined) {
    if (!['pending', 'reviewing', 'approved', 'rejected'].includes(status)) {
      throw new ActionError('invalid-argument', 'Status inválido')
    }
    updateData.status = status
  } else {
    updateData.status = existingStatus
  }

  await requestRef.update(updateData)

  // Sincroniza el estado de la mascota con el flujo público:
  // - pending / reviewing → mascota sigue "en proceso" (no listada públicamente)
  // - approved → adoptada
  // - rejected → vuelve a disponible para adopción
  if (status && status !== existing?.status) {
    const pid = existing?.pet_id as string | undefined
    if (!pid) {
      throw new ActionError('failed-precondition', 'Solicitud sin mascota asociada')
    }
    const petRef = petsCollection().doc(pid)
    let newPetStatus: 'available' | 'in_process' | 'adopted'
    if (status === 'approved') {
      newPetStatus = 'adopted'
    } else if (status === 'rejected') {
      newPetStatus = 'available'
    } else {
      newPetStatus = 'in_process'
    }
    await petRef.update({
      status: newPetStatus,
      adopted_date: status === 'approved' ? now : null,
      updated_at: now,
    })
  }

  await writeAuditLog('adoption_requests', id, 'UPDATE', existing ?? null, updateData, uid)
}

export async function deleteAdoptionRequestRecord(uid: string, id: string): Promise<void> {
  const requestRef = adoptionsCollection().doc(id)
  const requestSnap = await requestRef.get()
  if (!requestSnap.exists) {
    throw new ActionError('not-found', 'Solicitud no encontrada')
  }

  const existing = requestSnap.data()
  const reqStatus = existing?.status as string | undefined
  const petId = existing?.pet_id as string | undefined

  if (petId && (reqStatus === 'pending' || reqStatus === 'reviewing')) {
    await petsCollection().doc(petId).update({ status: 'available', updated_at: new Date().toISOString() })
  }

  await writeAuditLog('adoption_requests', id, 'DELETE', existing ?? null, null, uid)
  await requestRef.delete()
}
