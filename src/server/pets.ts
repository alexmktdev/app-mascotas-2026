import 'server-only'

import { unstable_cache } from 'next/cache'
import { adminDb } from '@/lib/firebase-admin'
import { sanitizeText, normalizeWeightKg } from '@/server/sanitize'
import { writeAuditLog } from '@/server/audit'
import { ActionError } from '@/server/errors'
import { PET_PAGE_SIZE, ADMIN_PAGE_SIZE } from '@/constants'
import type {
  Pet,
  PetCardData,
  PetFilters,
  AdminPetFilters,
  PaginatedResponse,
  DashboardStats,
} from '@/types/firebase.types'

const petsCollection = () => adminDb.collection('pets')

function petFromData(id: string, data: Record<string, unknown>): Pet {
  return {
    id,
    name: String(data.name ?? ''),
    species: data.species === 'dog' || data.species === 'cat' ? data.species : 'dog',
    breed: (data.breed as string | null) ?? null,
    age_months: Number(data.age_months ?? 0),
    gender: data.gender === 'male' || data.gender === 'female' ? data.gender : 'male',
    size: ['small', 'medium', 'large', 'xlarge'].includes(data.size as string)
      ? (data.size as 'small' | 'medium' | 'large' | 'xlarge')
      : null,
    color: (data.color as string | null) ?? null,
    contact_phone: (data.contact_phone as string | null) ?? null,
    weight_kg: (data.weight_kg as number | null) ?? null,
    sterilized: Boolean(data.sterilized),
    vaccinated: Boolean(data.vaccinated),
    dewormed: Boolean(data.dewormed),
    microchip: Boolean(data.microchip),
    health_notes: (data.health_notes as string | null) ?? null,
    personality: (data.personality as string | null) ?? null,
    story: (data.story as string | null) ?? null,
    good_with_kids: (data.good_with_kids as boolean | null) ?? null,
    good_with_dogs: (data.good_with_dogs as boolean | null) ?? null,
    good_with_cats: (data.good_with_cats as boolean | null) ?? null,
    special_needs: (data.special_needs as string | null) ?? null,
    status: ['available', 'in_process', 'adopted'].includes(data.status as string)
      ? (data.status as 'available' | 'in_process' | 'adopted')
      : 'available',
    photo_urls: Array.isArray(data.photo_urls) ? data.photo_urls.filter((u): u is string => typeof u === 'string') : [],
    drive_folder_id: (data.drive_folder_id as string | null) ?? null,
    intake_date: (data.intake_date as string) || '',
    adopted_date: (data.adopted_date as string | null) ?? null,
    created_by: (data.created_by as string | null) ?? null,
    updated_by: (data.updated_by as string | null) ?? null,
    created_at: (data.created_at as string) || '',
    updated_at: (data.updated_at as string) || '',
  }
}

// ─────────────────────────────────────────────────────────────────────────
// LECTURA
// ─────────────────────────────────────────────────────────────────────────

export const fetchPublicPets = unstable_cache(
  fetchPublicPetsUncached,
  ['fetch-public-pets'],
  { revalidate: 60, tags: ['pets'] },
)

async function fetchPublicPetsUncached(filters: PetFilters): Promise<PaginatedResponse<PetCardData>> {
  const page = filters.page ?? 1
  const from = (page - 1) * PET_PAGE_SIZE
  const to = from + PET_PAGE_SIZE

  let q = petsCollection().where('status', '==', 'available').orderBy('created_at', 'desc')
  if (filters.species) {
    q = petsCollection()
      .where('status', '==', 'available')
      .where('species', '==', filters.species)
      .orderBy('created_at', 'desc')
  }

  const snapshot = await q.get()
  let results = snapshot.docs.map((d) => petFromData(d.id, d.data()))

  if (filters.size?.length) {
    results = results.filter((p) => p.size && filters.size!.includes(p.size))
  }
  if (filters.gender?.length) {
    results = results.filter((p) => p.gender && filters.gender!.includes(p.gender))
  }
  if (filters.ageRange?.length) {
    const ranges: Record<string, [number, number]> = {
      cachorro: [0, 12],
      joven: [13, 36],
      adulto: [37, 96],
      senior: [97, 1200],
    }
    results = results.filter((p) =>
      filters.ageRange!.some((r) => {
        const [min, max] = ranges[r] ?? [0, 9999]
        return p.age_months >= min && p.age_months <= max
      }),
    )
  }
  if (filters.health?.length) {
    if (filters.health.includes('vaccinated')) results = results.filter((p) => p.vaccinated)
    if (filters.health.includes('sterilized')) results = results.filter((p) => p.sterilized)
    if (filters.health.includes('dewormed')) results = results.filter((p) => p.dewormed)
    if (filters.health.includes('microchip')) results = results.filter((p) => p.microchip)
  }
  if (filters.compatibility?.length) {
    if (filters.compatibility.includes('kids')) results = results.filter((p) => p.good_with_kids)
    if (filters.compatibility.includes('dogs')) results = results.filter((p) => p.good_with_dogs)
    if (filters.compatibility.includes('cats')) results = results.filter((p) => p.good_with_cats)
  }
  if (filters.search) {
    const term = filters.search.toLowerCase()
    results = results.filter((p) => p.name.toLowerCase().includes(term))
  }

  const total = results.length
  const pageCount = Math.ceil(total / PET_PAGE_SIZE)
  const paged = results.slice(from, to)

  return { data: paged as PetCardData[], total, pageCount }
}

export type FetchPetDetailOptions = {
  /** Solo devuelve la mascota si está disponible para adopción pública. */
  visibility?: 'public' | 'all'
}

export const fetchPetDetail = unstable_cache(
  fetchPetDetailUncached,
  ['fetch-pet-detail'],
  { revalidate: 60, tags: ['pets'] },
)

async function fetchPetDetailUncached(id: string, options?: FetchPetDetailOptions): Promise<Pet | null> {
  const snap = await petsCollection().doc(id).get()
  if (!snap.exists) return null

  const pet = petFromData(snap.id, snap.data()!)
  if (options?.visibility === 'public' && pet.status !== 'available') {
    return null
  }
  return pet
}

export const fetchAdminPets = unstable_cache(
  fetchAdminPetsUncached,
  ['fetch-admin-pets'],
  { revalidate: 30, tags: ['pets'] },
)

async function fetchAdminPetsUncached(filters: AdminPetFilters): Promise<PaginatedResponse<Pet>> {
  const page = filters.page ?? 1
  const from = (page - 1) * ADMIN_PAGE_SIZE
  const to = from + ADMIN_PAGE_SIZE

  let q: FirebaseFirestore.Query = petsCollection().orderBy('created_at', 'desc')
  if (filters.status && filters.species) {
    q = petsCollection()
      .where('status', '==', filters.status)
      .where('species', '==', filters.species)
      .orderBy('created_at', 'desc')
  } else if (filters.status) {
    q = petsCollection().where('status', '==', filters.status).orderBy('created_at', 'desc')
  } else if (filters.species) {
    q = petsCollection().where('species', '==', filters.species).orderBy('created_at', 'desc')
  }

  const snapshot = await q.get()
  const results = snapshot.docs.map((d) => petFromData(d.id, d.data()))

  const total = results.length
  const pageCount = Math.ceil(total / ADMIN_PAGE_SIZE)
  const paged = results.slice(from, to)

  return { data: paged, total, pageCount }
}

export const fetchAllPetStats = unstable_cache(
  fetchAllPetStatsUncached,
  ['fetch-all-pet-stats'],
  { revalidate: 30, tags: ['pets'] },
)

async function fetchAllPetStatsUncached(): Promise<DashboardStats> {
  const [availableSnap, inProcessSnap, adoptedSnap] = await Promise.all([
    petsCollection().where('status', '==', 'available').count().get(),
    petsCollection().where('status', '==', 'in_process').count().get(),
    petsCollection().where('status', '==', 'adopted').count().get(),
  ])

  return {
    available: availableSnap.data().count,
    inProcess: inProcessSnap.data().count,
    adopted: adoptedSnap.data().count,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// ESCRITURA — toda validación y autorización ocurre aquí (Admin SDK).
// Port 1:1 de functions/src/index.ts (createPet/updatePet/deletePet).
// ─────────────────────────────────────────────────────────────────────────

export async function createPetRecord(uid: string, petData: Record<string, unknown>): Promise<{ id: string }> {
  const name = sanitizeText(petData.name as string)
  if (!name) {
    throw new ActionError('invalid-argument', 'El nombre es requerido')
  }

  const species = petData.species
  if (species !== 'dog' && species !== 'cat') {
    throw new ActionError('invalid-argument', 'Species debe ser dog o cat')
  }

  const gender = petData.gender
  if (gender !== 'male' && gender !== 'female') {
    throw new ActionError('invalid-argument', 'Gender debe ser male o female')
  }

  const age_months = Number(petData.age_months)
  if (Number.isNaN(age_months) || age_months < 0 || age_months > 360) {
    throw new ActionError('invalid-argument', 'Edad en meses inválida')
  }

  const petRef = petsCollection().doc()
  const now = new Date().toISOString()
  const todayDate = now.slice(0, 10)

  const validated = {
    name,
    species,
    breed: sanitizeText(petData.breed as string | null) ?? null,
    age_months,
    gender,
    size: ['small', 'medium', 'large', 'xlarge'].includes(String(petData.size))
      ? (String(petData.size) as 'small' | 'medium' | 'large' | 'xlarge')
      : null,
    color: sanitizeText(petData.color as string | null) ?? null,
    contact_phone: sanitizeText(petData.contact_phone as string | null) ?? null,
    weight_kg: normalizeWeightKg(petData.weight_kg as number | null),
    sterilized: Boolean(petData.sterilized),
    vaccinated: Boolean(petData.vaccinated),
    dewormed: Boolean(petData.dewormed),
    microchip: Boolean(petData.microchip),
    health_notes: sanitizeText(petData.health_notes as string | null) ?? null,
    personality: sanitizeText(petData.personality as string | null) ?? null,
    story: sanitizeText(petData.story as string | null) ?? null,
    good_with_kids: petData.good_with_kids != null ? Boolean(petData.good_with_kids) : null,
    good_with_dogs: petData.good_with_dogs != null ? Boolean(petData.good_with_dogs) : null,
    good_with_cats: petData.good_with_cats != null ? Boolean(petData.good_with_cats) : null,
    special_needs: sanitizeText(petData.special_needs as string | null) ?? null,
    status: ['available', 'in_process', 'adopted'].includes(String(petData.status))
      ? (String(petData.status) as 'available' | 'in_process' | 'adopted')
      : 'available',
    photo_urls: Array.isArray(petData.photo_urls) ? petData.photo_urls.filter((u): u is string => typeof u === 'string') : [],
    drive_folder_id: sanitizeText(petData.drive_folder_id as string | null) ?? null,
    intake_date: (petData.intake_date as string | undefined)?.trim() || todayDate,
    adopted_date: null,
    created_by: uid,
    updated_by: null,
    created_at: now,
    updated_at: now,
  }

  await petRef.set(validated)
  await writeAuditLog('pets', petRef.id, 'INSERT', null, validated, uid)

  return { id: petRef.id }
}

/**
 * Cuando el estado de una mascota se cambia manualmente (ej. de "in_process" de
 * vuelta a "available"), cierra cualquier solicitud de adopción pending/reviewing
 * que aún la referencie, para que no quede una solicitud abierta sobre una mascota
 * que ya no está "en proceso" para ella.
 */
async function closeOpenAdoptionRequestsForPet(petId: string, uid: string, newPetStatus: string): Promise<string[]> {
  const adoptionsCollection = adminDb.collection('adoption_requests')
  const snap = await adoptionsCollection.where('pet_id', '==', petId).where('status', 'in', ['pending', 'reviewing']).get()
  if (snap.empty) return []

  const now = new Date().toISOString()
  const closedIds: string[] = []

  for (const doc of snap.docs) {
    const existing = doc.data()
    const updateData = {
      status: 'rejected' as const,
      admin_notes: `Cerrada automáticamente: la mascota cambió de estado a "${newPetStatus}".`,
      reviewed_by: uid,
      reviewed_at: now,
    }
    await doc.ref.update(updateData)
    await writeAuditLog('adoption_requests', doc.id, 'UPDATE', existing, updateData, uid)
    closedIds.push(doc.id)
  }

  return closedIds
}

export async function updatePetRecord(uid: string, id: string, updates: Record<string, unknown>): Promise<{ closedAdoptionRequestIds: string[] }> {
  const petRef = petsCollection().doc(id)
  const petSnap = await petRef.get()
  if (!petSnap.exists) {
    throw new ActionError('not-found', 'Mascota no encontrada')
  }
  const existing = petSnap.data() ?? null

  // Control de concurrencia optimista: si el formulario de edición se cargó con
  // datos antiguos y, mientras tanto, la mascota cambió por otra vía (ej. se
  // aprobó una solicitud de adopción y pasó a "adopted"), rechazamos el guardado
  // para no sobrescribir ese cambio con datos obsoletos.
  if (updates.expected_updated_at !== undefined) {
    const expected = updates.expected_updated_at as string
    if (expected && existing?.updated_at !== expected) {
      throw new ActionError(
        'failed-precondition',
        'Esta mascota fue modificada en otro lugar (por ejemplo, se aprobó una solicitud de adopción). Recarga la página para ver los datos más recientes antes de guardar.',
      )
    }
  }

  const updateData: Record<string, unknown> = {}

  if (updates.name !== undefined) {
    const v = sanitizeText(updates.name as string)
    if (!v) throw new ActionError('invalid-argument', 'El nombre no puede estar vacío')
    updateData.name = v
  }
  if (updates.species !== undefined) {
    if (updates.species !== 'dog' && updates.species !== 'cat') {
      throw new ActionError('invalid-argument', 'Species inválido')
    }
    updateData.species = updates.species
  }
  if (updates.breed !== undefined) updateData.breed = sanitizeText(updates.breed as string | null) ?? null
  if (updates.age_months !== undefined) {
    const v = Number(updates.age_months)
    if (Number.isNaN(v) || v < 0 || v > 360) {
      throw new ActionError('invalid-argument', 'Edad en meses inválida')
    }
    updateData.age_months = v
  }
  if (updates.gender !== undefined) {
    if (updates.gender !== 'male' && updates.gender !== 'female') {
      throw new ActionError('invalid-argument', 'Gender inválido')
    }
    updateData.gender = updates.gender
  }
  if (updates.size !== undefined) {
    if (updates.size && !['small', 'medium', 'large', 'xlarge'].includes(updates.size as string)) {
      throw new ActionError('invalid-argument', 'Size inválido')
    }
    updateData.size = updates.size || null
  }
  if (updates.color !== undefined) updateData.color = sanitizeText(updates.color as string | null) ?? null
  if (updates.contact_phone !== undefined) updateData.contact_phone = sanitizeText(updates.contact_phone as string | null) ?? null
  if (updates.weight_kg !== undefined) updateData.weight_kg = normalizeWeightKg(updates.weight_kg as number | null)
  if (updates.sterilized !== undefined) updateData.sterilized = Boolean(updates.sterilized)
  if (updates.vaccinated !== undefined) updateData.vaccinated = Boolean(updates.vaccinated)
  if (updates.dewormed !== undefined) updateData.dewormed = Boolean(updates.dewormed)
  if (updates.microchip !== undefined) updateData.microchip = Boolean(updates.microchip)
  if (updates.health_notes !== undefined) updateData.health_notes = sanitizeText(updates.health_notes as string | null) ?? null
  if (updates.personality !== undefined) updateData.personality = sanitizeText(updates.personality as string | null) ?? null
  if (updates.story !== undefined) updateData.story = sanitizeText(updates.story as string | null) ?? null
  if (updates.good_with_kids !== undefined) updateData.good_with_kids = updates.good_with_kids != null ? Boolean(updates.good_with_kids) : null
  if (updates.good_with_dogs !== undefined) updateData.good_with_dogs = updates.good_with_dogs != null ? Boolean(updates.good_with_dogs) : null
  if (updates.good_with_cats !== undefined) updateData.good_with_cats = updates.good_with_cats != null ? Boolean(updates.good_with_cats) : null
  if (updates.special_needs !== undefined) updateData.special_needs = sanitizeText(updates.special_needs as string | null) ?? null
  let closedAdoptionRequestIds: string[] = []
  if (updates.status !== undefined) {
    if (!['available', 'in_process', 'adopted'].includes(updates.status as string)) {
      throw new ActionError('invalid-argument', 'Status inválido')
    }
    updateData.status = updates.status
    updateData.adopted_date = updates.status === 'adopted' ? new Date().toISOString() : null

    if (updates.status !== existing?.status) {
      closedAdoptionRequestIds = await closeOpenAdoptionRequestsForPet(id, uid, updates.status as string)
    }
  }
  if (updates.photo_urls !== undefined) {
    if (!Array.isArray(updates.photo_urls)) {
      throw new ActionError('invalid-argument', 'photo_urls debe ser array')
    }
    updateData.photo_urls = updates.photo_urls.filter((u): u is string => typeof u === 'string')
  }
  if (updates.drive_folder_id !== undefined) updateData.drive_folder_id = sanitizeText(updates.drive_folder_id as string | null) ?? null
  if (updates.intake_date !== undefined) updateData.intake_date = (updates.intake_date as string)?.trim() || ''

  updateData.updated_by = uid
  updateData.updated_at = new Date().toISOString()

  await petRef.update(updateData)
  await writeAuditLog('pets', id, 'UPDATE', existing, updateData, uid)

  return { closedAdoptionRequestIds }
}

export async function deletePetRecord(uid: string, id: string): Promise<{ photoUrls: string[] }> {
  const petRef = petsCollection().doc(id)
  const petSnap = await petRef.get()
  if (!petSnap.exists) {
    throw new ActionError('not-found', 'Mascota no encontrada')
  }
  const petData = petSnap.data() ?? null
  const photoUrls = Array.isArray(petData?.photo_urls)
    ? (petData!.photo_urls as unknown[]).filter((u): u is string => typeof u === 'string')
    : []

  await writeAuditLog('pets', id, 'DELETE', petData, null, uid)
  await petRef.delete()

  return { photoUrls }
}

/** Agrega una URL de foto a una mascota (máx. 5). Usado por el upload a R2. */
export async function addPetPhoto(petId: string, url: string): Promise<void> {
  const petRef = petsCollection().doc(petId)
  const petSnap = await petRef.get()
  if (!petSnap.exists) {
    throw new ActionError('not-found', 'Mascota no encontrada')
  }

  const existingUrls = (petSnap.data()?.photo_urls as string[]) ?? []
  const newUrls = [...existingUrls, url]
  if (newUrls.length > 5) {
    throw new ActionError('invalid-argument', 'Máximo 5 fotos por mascota')
  }

  await petRef.update({ photo_urls: newUrls, updated_at: new Date().toISOString() })
}

/** Quita una URL de foto de una mascota. */
export async function removePetPhoto(petId: string, photoUrl: string): Promise<void> {
  const petRef = petsCollection().doc(petId)
  const petSnap = await petRef.get()
  if (!petSnap.exists) {
    throw new ActionError('not-found', 'Mascota no encontrada')
  }

  const existingUrls = (petSnap.data()?.photo_urls as string[]) ?? []
  if (!existingUrls.includes(photoUrl)) {
    throw new ActionError('not-found', 'Foto no encontrada en esta mascota')
  }

  await petRef.update({
    photo_urls: existingUrls.filter((u) => u !== photoUrl),
    updated_at: new Date().toISOString(),
  })
}
