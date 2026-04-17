/**
 * Cliente de Firebase Cloud Functions (Callable).
 * Todas las operaciones sensibles pasan por aquí.
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

export type FunctionsError = {
  message: string
  code: string
}

function unwrapError(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>
    if (e.message && typeof e.message === 'string') return e.message
    if (e.error && typeof e.error === 'string') return e.error
    if (typeof error === 'string') return error
  }
  if (error instanceof Error) return error.message
  return 'Error desconocido'
}

export async function callFunction<TRequest, TResponse>(
  name: string,
  data: TRequest,
): Promise<TResponse> {
  const callable = httpsCallable< TRequest, TResponse>(functions, name)
  try {
    const result = await callable(data)
    return result.data
  } catch (error: unknown) {
    const wrapped = error as { details?: unknown }
    if (wrapped?.details && typeof wrapped.details === 'object') {
      const detail = wrapped.details as Record<string, unknown>
      if (detail?.message && typeof detail.message === 'string') {
        throw new Error(detail.message as string)
      }
    }
    throw new Error(unwrapError(error))
  }
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface CreateUserPayload {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'admin' | 'staff'
}

export interface UpdateUserPayload {
  uid?: string
  first_name?: string
  last_name?: string
  email?: string
  role?: 'admin' | 'staff'
  is_active?: boolean
}

export const functionsCreateUser = (data: CreateUserPayload) =>
  callFunction<CreateUserPayload, { uid: string; email: string }>('createUser', data)

export const functionsUpdateUser = (data: UpdateUserPayload) =>
  callFunction<UpdateUserPayload, { success: boolean }>('updateUser', data)

export const functionsDeleteUser = (data: { uid: string }) =>
  callFunction<{ uid: string }, { success: boolean }>('deleteUser', data)

// ─── Pets ────────────────────────────────────────────────────────────────────

export interface CreatePetPayload {
  name: string
  species: 'dog' | 'cat'
  breed?: string | null
  age_months: number
  gender: 'male' | 'female'
  size?: 'small' | 'medium' | 'large' | 'xlarge' | null
  color?: string | null
  contact_phone?: string | null
  weight_kg?: number | null
  sterilized?: boolean
  vaccinated?: boolean
  dewormed?: boolean
  microchip?: boolean
  health_notes?: string | null
  personality?: string | null
  story?: string | null
  good_with_kids?: boolean | null
  good_with_dogs?: boolean | null
  good_with_cats?: boolean | null
  special_needs?: string | null
  photo_urls?: string[]
  drive_folder_id?: string | null
  intake_date?: string
}

export interface UpdatePetPayload {
  id?: string
  name?: string
  species?: 'dog' | 'cat'
  breed?: string | null
  age_months?: number
  gender?: 'male' | 'female'
  size?: 'small' | 'medium' | 'large' | 'xlarge' | null
  color?: string | null
  contact_phone?: string | null
  weight_kg?: number | null
  sterilized?: boolean
  vaccinated?: boolean
  dewormed?: boolean
  microchip?: boolean
  health_notes?: string | null
  personality?: string | null
  story?: string | null
  good_with_kids?: boolean | null
  good_with_dogs?: boolean | null
  good_with_cats?: boolean | null
  special_needs?: string | null
  status?: 'available' | 'in_process' | 'adopted'
  photo_urls?: string[]
  drive_folder_id?: string | null
  intake_date?: string
  updated_by?: string | null
}

export const functionsCreatePet = (data: CreatePetPayload) =>
  callFunction<CreatePetPayload, { id: string }>('createPet', data)

export const functionsUpdatePet = (data: UpdatePetPayload) =>
  callFunction<UpdatePetPayload, { success: boolean }>('updatePet', data)

export const functionsDeletePet = (data: { id: string }) =>
  callFunction<{ id: string }, { success: boolean }>('deletePet', data)

// ─── Adoptions ───────────────────────────────────────────────────────────────

export interface CreateAdoptionRequestPayload {
  pet_id: string
  full_name: string
  email: string
  phone: string
  id_number: string
  address: string
  city: string
  housing_type?: 'house' | 'apartment' | 'farm' | 'other' | null
  has_yard?: boolean | null
  has_other_pets?: boolean | null
  other_pets_description?: string | null
  has_children?: boolean | null
  children_ages?: string | null
  motivation: string
  experience_with_pets?: string | null
  work_schedule?: string | null
}

export interface UpdateAdoptionRequestPayload {
  id?: string
  admin_notes?: string
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected'
}

export const functionsCreateAdoptionRequest = (data: CreateAdoptionRequestPayload) =>
  callFunction<CreateAdoptionRequestPayload, { id: string }>('createAdoptionRequest', data)

export const functionsUpdateAdoptionRequest = (data: UpdateAdoptionRequestPayload) =>
  callFunction<UpdateAdoptionRequestPayload, { success: boolean }>('updateAdoptionRequest', data)

export const functionsDeleteAdoptionRequest = (data: { id: string }) =>
  callFunction<{ id: string }, { success: boolean }>('deleteAdoptionRequest', data)

// ─── Storage ─────────────────────────────────────────────────────────────────

export interface UploadPetPhotoPayload {
  petId: string
  photoDataUrl: string
}

export interface DeletePetPhotoPayload {
  petId: string
  photoUrl: string
}

export const functionsUploadPetPhoto = (data: UploadPetPhotoPayload) =>
  callFunction<UploadPetPhotoPayload, { url: string }>('uploadPetPhoto', data)

export const functionsDeletePetPhoto = (data: DeletePetPhotoPayload) =>
  callFunction<DeletePetPhotoPayload, { success: boolean }>('deletePetPhoto', data)

// ─── Mantenimiento ──────────────────────────────────────────────────────────

export const functionsFixImageCacheHeaders = () =>
  callFunction<Record<string, never>, { fixed: number; message: string }>('fixImageCacheHeaders', {})