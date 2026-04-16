/**
 * Tipos para Firebase Firestore.
 */

export interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  role: 'admin' | 'staff'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Pet {
  id: string
  name: string
  species: 'dog' | 'cat'
  breed: string | null
  age_months: number
  gender: 'male' | 'female'
  size: 'small' | 'medium' | 'large' | 'xlarge' | null
  color: string | null
  contact_phone: string | null
  weight_kg: number | null
  sterilized: boolean
  vaccinated: boolean
  dewormed: boolean
  microchip: boolean
  health_notes: string | null
  personality: string | null
  story: string | null
  good_with_kids: boolean | null
  good_with_dogs: boolean | null
  good_with_cats: boolean | null
  special_needs: string | null
  status: 'available' | 'in_process' | 'adopted'
  photo_urls: string[]
  drive_folder_id: string | null
  intake_date: string
  adopted_date: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface AdoptionRequest {
  id: string
  pet_id: string
  full_name: string
  email: string
  phone: string
  id_number: string
  address: string
  city: string
  housing_type: 'house' | 'apartment' | 'farm' | 'other' | null
  has_yard: boolean | null
  has_other_pets: boolean | null
  other_pets_description: string | null
  has_children: boolean | null
  children_ages: string | null
  motivation: string
  experience_with_pets: string | null
  work_schedule: string | null
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  performed_by: string | null
  performed_at: string
}

export type PetInsert = {
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
  status?: 'available' | 'in_process' | 'adopted'
  photo_urls?: string[]
  drive_folder_id?: string | null
  intake_date?: string
  adopted_date?: string | null
  created_by?: string | null
  updated_by?: string | null
}
export type PetUpdate = {
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
  adopted_date?: string | null
  created_by?: string | null
  updated_by?: string | null
}
export type AdoptionRequestInsert = {
  pet_id: string
  full_name: string
  email: string
  phone: string
  id_number: string
  address: string
  city: string
  housing_type?: 'house' | 'apartment' | 'farm' | 'other' | null | undefined
  has_yard?: boolean | null | undefined
  has_other_pets?: boolean | null | undefined
  other_pets_description?: string | null | undefined
  has_children?: boolean | null | undefined
  children_ages?: string | null | undefined
  motivation: string
  experience_with_pets?: string | null | undefined
  work_schedule?: string | null | undefined
}
export type AdoptionRequestUpdate = Partial<Omit<AdoptionRequest, 'id' | 'created_at'>>
export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'>
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>

export type PetCardData = Pick<Pet, 'id' | 'name' | 'species' | 'breed' | 'age_months' | 'gender' | 'size' | 'sterilized' | 'vaccinated' | 'photo_urls' | 'status' | 'story'>

export type AdminAdoptionRow = AdoptionRequest & { pet_name?: string | null }

export type DashboardStats = {
  available: number
  inProcess: number
  adopted: number
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  pageCount: number
}

export type PetFilters = {
  species?: 'dog' | 'cat'
  breed?: string
  size?: ('small' | 'medium' | 'large' | 'xlarge')[]
  gender?: ('male' | 'female')[]
  ageRange?: ('cachorro' | 'joven' | 'adulto' | 'senior')[]
  health?: ('vaccinated' | 'sterilized' | 'dewormed' | 'microchip')[]
  compatibility?: ('kids' | 'dogs' | 'cats')[]
  traits?: string[]
  search?: string
  page?: number
}

export type AdminPetFilters = {
  status?: Pet['status']
  species?: Pet['species']
  page?: number
}

export type FormStatus = 'idle' | 'submitting' | 'success' | 'error'
