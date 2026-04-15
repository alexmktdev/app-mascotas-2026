/**
 * API de mascotas — Funciones que llaman a Supabase.
 * Reglas: tipado completo, paginación server-side, SELECT explícito, throwOnError.
 */

import { supabase } from '@/lib/supabase'
import type { PetFilters, PetCardData, AdminPetFilters, Pet, PetInsert, PetUpdate, PaginatedResponse } from '@/types'
import { PET_PAGE_SIZE, ADMIN_PAGE_SIZE } from '@/constants'
import { extractDriveFileId, isEphemeralImageRef, isPetStoragePublicUrl, sanitizeSearchInput } from '@/utils'
import { primeSignedUrlsCache, extractPetPhotoStoragePath } from '@/api/petPhotosStorage'
import { withTimeout } from '@/lib/withTimeout'

/** Límite alineado con UI (máx. 2) y con CHECK opcional en DB (migrations/003). */
const MAX_PET_PHOTOS = 2
/** Tras normalizar a fileId de Drive, los valores son cortos; el tope evita basura. */
const MAX_PHOTO_ID_LEN = 256
/** URLs públicas de Storage pueden ser largas; tope razonable para PostgREST. */
const MAX_STORAGE_URL_LEN = 2048

function sanitizePhotoUrls(urls: string[] | undefined | null): string[] {
  if (!urls?.length) return []
  return urls
    .map((u) => {
      const s = String(u).trim()
      if (!s) return null
      if (isEphemeralImageRef(s)) return null
      if (isPetStoragePublicUrl(s) && s.length <= MAX_STORAGE_URL_LEN) return s
      const id = extractDriveFileId(s)
      if (id && id.length <= MAX_PHOTO_ID_LEN) return id
      return null
    })
    .filter((x): x is string => x !== null)
    .slice(0, MAX_PET_PHOTOS)
}

function normalizeWeightKg(v: number | null | undefined): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number' && Number.isNaN(v)) return null
  const n = Number(v)
  if (Number.isNaN(n) || n < 0 || n > 200) return null
  return n
}

/** Postgres y JSON pueden comportarse mal con \\0 en texto. */
function sanitizePetTextField(s: string | null | undefined): string | null {
  if (s == null) return null
  const t = s.replace(/\u0000/g, '').trim()
  return t === '' ? null : t
}

/** Cuerpo JSON puro para PostgREST (sin proxies ni campos extra del formulario). */
function toJsonInsertPayload(payload: PetInsert): PetInsert {
  return JSON.parse(JSON.stringify(payload)) as PetInsert
}

/** Pet devuelto al crear: solo pedimos `id` al servidor (respuesta mínima) y el resto del payload ya lo tenemos. */
function petFromInsertResult(id: string, payload: PetInsert): Pet {
  const nowIso = new Date().toISOString()
  const todayDate = nowIso.slice(0, 10)
  const intake =
    payload.intake_date && String(payload.intake_date).trim() !== ''
      ? String(payload.intake_date).trim()
      : todayDate

  return {
    id,
    name: payload.name,
    species: payload.species,
    breed: payload.breed ?? null,
    age_months: payload.age_months,
    gender: payload.gender,
    size: payload.size ?? null,
    color: payload.color ?? null,
    contact_phone: payload.contact_phone ?? null,
    weight_kg: payload.weight_kg ?? null,
    sterilized: payload.sterilized ?? false,
    vaccinated: payload.vaccinated ?? false,
    dewormed: payload.dewormed ?? false,
    microchip: payload.microchip ?? false,
    health_notes: payload.health_notes ?? null,
    personality: payload.personality ?? null,
    story: payload.story ?? null,
    good_with_kids: payload.good_with_kids ?? null,
    good_with_dogs: payload.good_with_dogs ?? null,
    good_with_cats: payload.good_with_cats ?? null,
    special_needs: payload.special_needs ?? null,
    status: payload.status ?? 'available',
    photo_urls: sanitizePhotoUrls(payload.photo_urls),
    drive_folder_id: payload.drive_folder_id ?? null,
    intake_date: intake,
    adopted_date: null,
    created_by: payload.created_by ?? null,
    updated_by: payload.updated_by ?? null,
    created_at: nowIso,
    updated_at: nowIso,
  }
}

// ──────────────────────────────────────────────
// Campos seleccionados por vista
// ──────────────────────────────────────────────

const PUBLIC_CARD_FIELDS = 'id, name, species, breed, age_months, gender, size, sterilized, vaccinated, photo_urls, status' as const
const ADMIN_LIST_FIELDS = 'id, name, species, breed, age_months, status, intake_date, photo_urls' as const
const DETAIL_FIELDS = '*' as const  // Detalle necesita todos los campos

// ──────────────────────────────────────────────
// Público: mascotas disponibles (con filtros y paginación)
// ──────────────────────────────────────────────

export async function fetchPublicPets(
  filters: PetFilters
): Promise<PaginatedResponse<PetCardData>> {
  const page = filters.page ?? 1
  const from = (page - 1) * PET_PAGE_SIZE
  const to = from + PET_PAGE_SIZE - 1

  let query = supabase
    .from('pets')
    .select(PUBLIC_CARD_FIELDS, { count: 'exact' })
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.species) query = query.eq('species', filters.species)
  if (filters.breed) query = query.eq('breed', filters.breed)
  
  if (filters.size && filters.size.length > 0) {
    query = query.in('size', filters.size)
  }
  
  if (filters.gender && filters.gender.length > 0) {
    query = query.in('gender', filters.gender)
  }

  if (filters.ageRange && filters.ageRange.length > 0) {
    // Para rangos múltiples, construimos una condición OR (aunque or() en Supabase es un string)
    // O mejor, calculamos el min y max global de los rangos seleccionados
    const ranges = {
      cachorro: [0, 12],
      joven: [13, 36],
      adulto: [37, 96],
      senior: [97, 1200]
    }
    const mins = filters.ageRange
      .map((r) => ranges[r as keyof typeof ranges]?.[0])
      .filter((n): n is number => n !== undefined)
    const maxs = filters.ageRange
      .map((r) => ranges[r as keyof typeof ranges]?.[1])
      .filter((n): n is number => n !== undefined)
    if (mins.length && maxs.length) {
      query = query.gte('age_months', Math.min(...mins)).lte('age_months', Math.max(...maxs))
    }
  }

  if (filters.health && filters.health.length > 0) {
    if (filters.health.includes('vaccinated')) query = query.eq('vaccinated', true)
    if (filters.health.includes('sterilized')) query = query.eq('sterilized', true)
    if (filters.health.includes('dewormed')) query = query.eq('dewormed', true)
    if (filters.health.includes('microchip')) query = query.eq('microchip', true)
  }

  if (filters.compatibility && filters.compatibility.length > 0) {
    if (filters.compatibility.includes('kids')) query = query.eq('good_with_kids', true)
    if (filters.compatibility.includes('dogs')) query = query.eq('good_with_dogs', true)
    if (filters.compatibility.includes('cats')) query = query.eq('good_with_cats', true)
  }

  if (filters.traits && filters.traits.length > 0) {
    // Búsqueda simplificada: si tiene alguno de los rasgos seleccionados en el campo personality
    const traitConditions = filters.traits.map(t => `personality.ilike.%${t}%`).join(',')
    query = query.or(traitConditions)
  }

  if (filters.search) {
    const sanitized = sanitizeSearchInput(filters.search)
    if (sanitized) query = query.ilike('name', `%${sanitized}%`)
  }

  const { data, error, count } = await query

  if (error) throw error
  
  const results = data ?? []

  // Pre-firmar en lote las imágenes para evitar el problema de N+1 peticiones en la interfaz
  const pathsToSign = results
    .flatMap((pet) => pet.photo_urls ?? [])
    .map((url) => extractPetPhotoStoragePath(url))
    .filter((path): path is string => path !== null)

  if (pathsToSign.length > 0) {
    // Timeout defensivo de 5s para que el pre-firmado no bloquee el render del listado
    await withTimeout(
      primeSignedUrlsCache(pathsToSign),
      5000,
      'Timeout pre-firmado'
    ).catch((err) => {
       console.warn('[Storage] Fallo al pre-firmar las imágenes (Home):', err)
    })
  }

  return {
    data: results as PetCardData[],
    total: count ?? 0,
    pageCount: Math.ceil((count ?? 0) / PET_PAGE_SIZE),
  }
}

// ──────────────────────────────────────────────
// Público: detalle de una mascota
// ──────────────────────────────────────────────

export async function fetchPetDetail(id: string): Promise<Pet> {
  const { data, error } = await supabase
    .from('pets')
    .select(DETAIL_FIELDS)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ──────────────────────────────────────────────
// Admin: mascotas por estado (con paginación)
// ──────────────────────────────────────────────

export async function fetchAdminPets(filters: AdminPetFilters): Promise<PaginatedResponse<Pet>> {
  const page = filters.page ?? 1
  const from = (page - 1) * ADMIN_PAGE_SIZE
  const to = from + ADMIN_PAGE_SIZE - 1

  let query = supabase
    .from('pets')
    .select(ADMIN_LIST_FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.species) query = query.eq('species', filters.species)

  const { data, error, count } = await query

  if (error) throw error
  
  const results = data ?? []

  // Pre-firmar en lote las imágenes
  const pathsToSign = results
    .flatMap((pet) => pet.photo_urls ?? [])
    .map((url) => extractPetPhotoStoragePath(url))
    .filter((path): path is string => path !== null)

  if (pathsToSign.length > 0) {
    await primeSignedUrlsCache(pathsToSign).catch((err) => {
       console.warn('[Storage] Fallo al pre-firmar las imágenes (Admin):', err)
    })
  }

  return {
    data: results as unknown as Pet[],
    total: count ?? 0,
    pageCount: Math.ceil((count ?? 0) / ADMIN_PAGE_SIZE),
  }
}

// ──────────────────────────────────────────────
// Admin: CRUD de mascotas
// ──────────────────────────────────────────────

export async function createPet(pet: PetInsert): Promise<Pet> {
  const payload: PetInsert = {
    ...pet,
    breed: pet.breed?.trim() || null,
    color: pet.color?.trim() || null,
    health_notes: sanitizePetTextField(pet.health_notes ?? null),
    personality: sanitizePetTextField(pet.personality ?? null),
    special_needs: sanitizePetTextField(pet.special_needs ?? null),
    drive_folder_id: pet.drive_folder_id?.trim() || null,
    photo_urls: sanitizePhotoUrls(pet.photo_urls),
    weight_kg: normalizeWeightKg(pet.weight_kg ?? undefined),
  }

  const body = toJsonInsertPayload(payload)

  /** `.select('id')` sin `.single()` evita errores raros de PostgREST cuando la fila devuelta no coincide con lo esperado. */
  const { data, error } = await supabase.from('pets').insert(body).select('id')

  if (error) throw error

  const row = Array.isArray(data) ? data[0] : data
  const newId = row && typeof row === 'object' && 'id' in row ? String((row as { id: string }).id) : ''

  if (!newId) {
    throw new Error(
      'No se pudo confirmar el alta: no se recibió el id. Suele ser RLS (no puedes leer la fila tras insertar) o falta de fila en `profiles` para created_by.',
    )
  }

  return petFromInsertResult(newId, payload)
}

export async function updatePet(id: string, updates: PetUpdate): Promise<Pet> {
  const patch: PetUpdate = { ...updates }
  if (patch.photo_urls !== undefined) {
    patch.photo_urls = sanitizePhotoUrls(patch.photo_urls)
  }
  if (patch.weight_kg !== undefined) {
    patch.weight_kg = normalizeWeightKg(patch.weight_kg ?? undefined)
  }

  const { data, error } = await supabase
    .from('pets')
    .update(patch)
    .eq('id', id)
    .select(DETAIL_FIELDS)

  if (error) throw error

  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    throw new Error(
      'No se pudo confirmar la actualización. Comprueba permisos o recarga la mascota.',
    )
  }
  return row as Pet
}

export async function deletePet(id: string): Promise<void> {
  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ──────────────────────────────────────────────
// Dashboard: contadores por estado
// ──────────────────────────────────────────────

export async function fetchAllPetStats(): Promise<{ available: number, inProcess: number, adopted: number }> {
  // Ejecutamos las 3 cuentas en paralelo
  const [available, inProcess, adopted] = await Promise.all([
    supabase.from('pets').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    supabase.from('pets').select('*', { count: 'exact', head: true }).eq('status', 'in_process'),
    supabase.from('pets').select('*', { count: 'exact', head: true }).eq('status', 'adopted'),
  ])

  return {
    available: available.count ?? 0,
    inProcess: inProcess.count ?? 0,
    adopted: adopted.count ?? 0,
  }
}
