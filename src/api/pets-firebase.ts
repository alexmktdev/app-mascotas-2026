/**
 * API de mascotas — LECTURA SOLO.
 * Toda escritura (create, update, delete) va por Cloud Functions.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  getCountFromServer,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Pet, PetCardData, PaginatedResponse } from '@/types/firebase.types'
import { PET_PAGE_SIZE, ADMIN_PAGE_SIZE } from '@/constants'

const petsCollection = collection(db, 'pets')

function petFromData(id: string, data: Record<string, unknown>): Pet {
  return {
    id,
    name: String(data.name ?? ''),
    species: data.species === 'dog' || data.species === 'cat' ? data.species : 'dog',
    breed: data.breed as string | null,
    age_months: Number(data.age_months ?? 0),
    gender: data.gender === 'male' || data.gender === 'female' ? data.gender : 'male',
    size: ['small', 'medium', 'large', 'xlarge'].includes(data.size as string)
      ? (data.size as 'small' | 'medium' | 'large' | 'xlarge')
      : null,
    color: data.color as string | null,
    contact_phone: data.contact_phone as string | null,
    weight_kg: data.weight_kg as number | null,
    sterilized: Boolean(data.sterilized),
    vaccinated: Boolean(data.vaccinated),
    dewormed: Boolean(data.dewormed),
    microchip: Boolean(data.microchip),
    health_notes: data.health_notes as string | null,
    personality: data.personality as string | null,
    story: data.story as string | null,
    good_with_kids: data.good_with_kids as boolean | null,
    good_with_dogs: data.good_with_dogs as boolean | null,
    good_with_cats: data.good_with_cats as boolean | null,
    special_needs: data.special_needs as string | null,
    status: ['available', 'in_process', 'adopted'].includes(data.status as string)
      ? (data.status as 'available' | 'in_process' | 'adopted')
      : 'available',
    photo_urls: Array.isArray(data.photo_urls) ? data.photo_urls.filter((u): u is string => typeof u === 'string') : [],
    drive_folder_id: data.drive_folder_id as string | null,
    intake_date: data.intake_date as string || '',
    adopted_date: data.adopted_date as string | null,
    created_by: data.created_by as string | null,
    updated_by: data.updated_by as string | null,
    created_at: data.created_at as string || '',
    updated_at: data.updated_at as string || '',
  }
}

// ─── SOLO LECTURA — Sin autenticación requerida para públicas ───────────────

export async function fetchPublicPets(filters: {
  species?: 'dog' | 'cat'
  size?: string[]
  gender?: string[]
  ageRange?: string[]
  health?: string[]
  compatibility?: string[]
  traits?: string[]
  search?: string
  page?: number
}): Promise<PaginatedResponse<PetCardData>> {
  const page = filters.page ?? 1
  const from = (page - 1) * PET_PAGE_SIZE
  const to = from + PET_PAGE_SIZE - 1

  let q = query(petsCollection, where('status', '==', 'available'), orderBy('created_at', 'desc'))

  if (filters.species) {
    q = query(petsCollection, where('status', '==', 'available'), where('species', '==', filters.species), orderBy('created_at', 'desc'))
  }

  const snapshot = await getDocs(q)
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
    results = results.filter((p) => {
      return filters.ageRange!.some((r) => {
        const [min, max] = ranges[r] ?? [0, 9999]
        return p.age_months >= min && p.age_months <= max
      })
    })
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
  const paged = results.slice(from, to + 1)

  return { data: paged as PetCardData[], total, pageCount }
}

export type FetchPetDetailOptions = {
  /** Solo devuelve la mascota si está disponible para adop pública (oculta in_process / adopted). */
  visibility?: 'public' | 'all'
}

export async function fetchPetDetail(id: string, options?: FetchPetDetailOptions): Promise<Pet> {
  const docRef = doc(db, 'pets', id)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) {
    throw new Error('Mascota no encontrada')
  }
  const pet = petFromData(docSnap.id, docSnap.data())
  if (options?.visibility === 'public' && pet.status !== 'available') {
    throw new Error('Mascota no encontrada')
  }
  return pet
}

export async function fetchAdminPets(filters: {
  status?: Pet['status']
  species?: Pet['species']
  page?: number
}): Promise<PaginatedResponse<Pet>> {
  const page = filters.page ?? 1
  const from = (page - 1) * ADMIN_PAGE_SIZE
  const to = from + ADMIN_PAGE_SIZE - 1

  let q = query(petsCollection, orderBy('created_at', 'desc'))

  if (filters.status && filters.species) {
    q = query(petsCollection, where('status', '==', filters.status), where('species', '==', filters.species), orderBy('created_at', 'desc'))
  } else if (filters.status) {
    q = query(petsCollection, where('status', '==', filters.status), orderBy('created_at', 'desc'))
  } else if (filters.species) {
    q = query(petsCollection, where('species', '==', filters.species), orderBy('created_at', 'desc'))
  }

  const snapshot = await getDocs(q)
  const results = snapshot.docs.map((d) => petFromData(d.id, d.data()))

  const total = results.length
  const pageCount = Math.ceil(total / ADMIN_PAGE_SIZE)
  const paged = results.slice(from, to + 1)

  return { data: paged, total, pageCount }
}

export async function fetchAllPetStats(): Promise<{ available: number; inProcess: number; adopted: number }> {
  const qAvailable = query(petsCollection, where('status', '==', 'available'))
  const qInProcess = query(petsCollection, where('status', '==', 'in_process'))
  const qAdopted = query(petsCollection, where('status', '==', 'adopted'))

  const [availableSnap, inProcessSnap, adoptedSnap] = await Promise.all([
    getCountFromServer(qAvailable),
    getCountFromServer(qInProcess),
    getCountFromServer(qAdopted),
  ])

  return {
    available: availableSnap.data().count,
    inProcess: inProcessSnap.data().count,
    adopted: adoptedSnap.data().count,
  }
}

// ─── ESTAS FUNCIONES YA NO SE USAN — la escritura va por Cloud Functions ─────
// Se mantienen aquí por compatibilidad de tipos, pero no deben llamarse.

export async function createPet(_pet: unknown): Promise<never> {
  throw new Error('No llamar directly. Use functionsCreatePet from @/lib/functions')
}

export async function updatePet(_id: string, _updates: unknown): Promise<never> {
  throw new Error('No llamar directly. Use functionsUpdatePet from @/lib/functions')
}

export async function deletePet(_id: string): Promise<never> {
  throw new Error('No llamar directly. Use functionsDeletePet from @/lib/functions')
}