/**
 * Tipos de aplicación derivados de los tipos generados de Supabase.
 * NO crear tipos paralelos manuales — siempre derivar de Database.
 */

import type { Database } from './database.types'

// ──────────────────────────────────────────────
// Tipos de tablas
// ──────────────────────────────────────────────

// Profiles
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Pets
export type Pet = Database['public']['Tables']['pets']['Row']
export type PetInsert = Database['public']['Tables']['pets']['Insert']
export type PetUpdate = Database['public']['Tables']['pets']['Update']

// Adoption Requests
export type AdoptionRequest = Database['public']['Tables']['adoption_requests']['Row']
export type AdoptionRequestInsert = Database['public']['Tables']['adoption_requests']['Insert']
export type AdoptionRequestUpdate = Database['public']['Tables']['adoption_requests']['Update']

/** Lista admin: mismos campos que el formulario público + nombre de mascota (join). */
export type AdoptionRequestAdminRow = AdoptionRequest & { pet_name: string | null }

// Audit Log
export type AuditLog = Database['public']['Tables']['audit_log']['Row']

// ──────────────────────────────────────────────
// Tipos de utilidad
// ──────────────────────────────────────────────

/** Filtros para la búsqueda pública de mascotas */
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

/** Filtros para el panel admin */
export type AdminPetFilters = {
  status?: Pet['status']
  species?: Pet['species']
  page?: number
}

/** Estado de un formulario */
export type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

/** Roles de usuario */
export type UserRole = Profile['role']

/** Estados de mascota */
export type PetStatus = Pet['status']

/** Especies */
export type PetSpecies = Pet['species']

/** Género */
export type PetGender = Pet['gender']

/** Tamaño */
export type PetSize = NonNullable<Pet['size']>

/** Tipo de vivienda */
export type HousingType = NonNullable<AdoptionRequest['housing_type']>

/** Estado de solicitud */
export type AdoptionStatus = AdoptionRequest['status']

// ──────────────────────────────────────────────
// Tipos para respuestas paginadas
// ──────────────────────────────────────────────

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  pageCount: number
}

// ──────────────────────────────────────────────
// Tipos para la card pública (solo campos necesarios)
// ──────────────────────────────────────────────

export type PetCardData = Pick<
  Pet,
  | 'id'
  | 'name'
  | 'species'
  | 'breed'
  | 'age_months'
  | 'gender'
  | 'size'
  | 'sterilized'
  | 'vaccinated'
  | 'photo_urls'
  | 'status'
  | 'story'
>

// ──────────────────────────────────────────────
// Tipos para tablas admin (solo campos necesarios)
// ──────────────────────────────────────────────

export type AdminPetRow = Pick<
  Pet,
  | 'id'
  | 'name'
  | 'species'
  | 'breed'
  | 'age_months'
  | 'status'
  | 'intake_date'
  | 'photo_urls'
>

export type AdminAdoptionRow = Pick<
  AdoptionRequest,
  | 'id'
  | 'pet_id'
  | 'full_name'
  | 'email'
  | 'phone'
  | 'status'
  | 'created_at'
> & {
  /** Nombre de la mascota (join) */
  pet_name?: string
}

export type AdminUserRow = Pick<
  Profile,
  | 'id'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'role'
  | 'is_active'
  | 'created_at'
>

// ──────────────────────────────────────────────
// Tipos para estadísticas del dashboard
// ──────────────────────────────────────────────

export type DashboardStats = {
  available: number
  inProcess: number
  adopted: number
}
