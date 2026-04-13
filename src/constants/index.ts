/**
 * Constantes de la aplicación.
 * NO hardcodear strings de UI — centralizar aquí.
 */

// ──────────────────────────────────────────────
// Roles de usuario
// ──────────────────────────────────────────────
export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
} as const

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  staff: 'Staff',
}

// ──────────────────────────────────────────────
// Estados de mascotas
// ──────────────────────────────────────────────
export const PET_STATUS = {
  AVAILABLE: 'available',
  IN_PROCESS: 'in_process',
  ADOPTED: 'adopted',
} as const

export const PET_STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  in_process: 'En proceso',
  adopted: 'Adoptado/a',
}

export const PET_STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  in_process: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  adopted: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
}

/** Badges más contrastados en tablas admin */
export const PET_STATUS_ADMIN_TABLE: Record<string, string> = {
  available:
    'border border-emerald-400/80 bg-gradient-to-r from-emerald-50 to-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-900 shadow-sm',
  in_process:
    'border border-amber-400/80 bg-gradient-to-r from-amber-50 to-amber-100/80 px-3 py-1 text-xs font-bold text-amber-950 shadow-sm',
  adopted:
    'border border-violet-400/80 bg-gradient-to-r from-violet-50 to-violet-100/80 px-3 py-1 text-xs font-bold text-violet-950 shadow-sm',
}

/** Etiqueta de estado sobre la foto en tarjetas públicas */
export const PET_STATUS_CARD_OVERLAY: Record<string, string> = {
  available: 'border-emerald-300/90 bg-emerald-950/80 text-emerald-50 shadow-lg shadow-emerald-950/20',
  in_process: 'border-amber-300/90 bg-amber-950/75 text-amber-50 shadow-lg shadow-amber-950/20',
  adopted: 'border-violet-300/90 bg-violet-950/80 text-violet-50 shadow-lg shadow-violet-950/20',
}

/** Solicitudes de adopción — pills más visibles en tabla admin */
export const ADOPTION_STATUS_ADMIN_TABLE: Record<string, string> = {
  pending:
    'border border-sky-400/80 bg-gradient-to-r from-sky-50 to-sky-100/90 px-3 py-1 text-xs font-bold text-sky-950 shadow-sm',
  reviewing:
    'border border-indigo-400/80 bg-gradient-to-r from-indigo-50 to-indigo-100/90 px-3 py-1 text-xs font-bold text-indigo-950 shadow-sm',
  approved:
    'border border-emerald-400/80 bg-gradient-to-r from-emerald-50 to-emerald-100/90 px-3 py-1 text-xs font-bold text-emerald-950 shadow-sm',
  rejected:
    'border border-rose-400/80 bg-gradient-to-r from-rose-50 to-rose-100/90 px-3 py-1 text-xs font-bold text-rose-950 shadow-sm',
}

// ──────────────────────────────────────────────
// Especies
// ──────────────────────────────────────────────
export const SPECIES = {
  DOG: 'dog',
  CAT: 'cat',
} as const

export const SPECIES_LABELS: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
}

export const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐈',
}

// ──────────────────────────────────────────────
// Género
// ──────────────────────────────────────────────
export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
} as const

export const GENDER_LABELS: Record<string, string> = {
  male: 'Macho',
  female: 'Hembra',
}

// ──────────────────────────────────────────────
// Tamaños
// ──────────────────────────────────────────────
export const PET_SIZE = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  XLARGE: 'xlarge',
} as const

export const PET_SIZE_LABELS: Record<string, string> = {
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
  xlarge: 'Muy grande',
}

// ──────────────────────────────────────────────
// Tipo de vivienda
// ──────────────────────────────────────────────
export const HOUSING_TYPE = {
  HOUSE: 'house',
  APARTMENT: 'apartment',
  FARM: 'farm',
  OTHER: 'other',
} as const

export const HOUSING_TYPE_LABELS: Record<string, string> = {
  house: 'Casa',
  apartment: 'Departamento',
  farm: 'Campo / Parcela',
  other: 'Otro',
}

// ──────────────────────────────────────────────
// Estado de solicitud de adopción
// ──────────────────────────────────────────────
export const ADOPTION_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export const ADOPTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  reviewing: 'En revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

export const ADOPTION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  reviewing: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
}

// ──────────────────────────────────────────────
// Fotos de mascotas (Supabase Storage, bucket pet-photos)
// ──────────────────────────────────────────────
export const PET_PHOTOS_BUCKET = 'pet-photos'
export const PET_PHOTO_MAX_COUNT = 2
/** Tamaño máximo por imagen (debe coincidir con file_size_limit del bucket, migración 004). 1,2 MiB. */
export const PET_PHOTO_MAX_BYTES = Math.floor(1.2 * 1024 * 1024)
/** Etiqueta para toasts / UI (derivada de PET_PHOTO_MAX_BYTES). */
export const PET_PHOTO_MAX_SIZE_LABEL_ES =
  PET_PHOTO_MAX_BYTES >= 1024 * 1024
    ? `${(PET_PHOTO_MAX_BYTES / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
    : `${Math.round(PET_PHOTO_MAX_BYTES / 1024)} KB`
export const PET_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const PET_PHOTO_ACCEPT_ATTR = PET_PHOTO_MIME_TYPES.join(',')

// ──────────────────────────────────────────────
// Paginación
// ──────────────────────────────────────────────
export const PET_PAGE_SIZE = 9
export const ADMIN_PAGE_SIZE = 10

// ──────────────────────────────────────────────
// Razas comunes (para filtros/sugerencias)
// ──────────────────────────────────────────────
export const DOG_BREEDS = [
  'Mestizo',
  'Labrador Retriever',
  'Pastor Alemán',
  'Golden Retriever',
  'Bulldog',
  'Poodle',
  'Chihuahua',
  'Rottweiler',
  'Yorkshire Terrier',
  'Boxer',
  'Dachshund',
  'Husky Siberiano',
  'Pitbull',
  'Border Collie',
  'Cocker Spaniel',
  'Otro',
] as const

export const CAT_BREEDS = [
  'Mestizo',
  'Siamés',
  'Persa',
  'Maine Coon',
  'Angora',
  'Bengalí',
  'Ragdoll',
  'Británico de pelo corto',
  'Otro',
] as const

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────
export const DASHBOARD_REFETCH_INTERVAL = 1000 * 60  // 60 segundos

// ──────────────────────────────────────────────
// Anti-spam
// ──────────────────────────────────────────────
export const SUBMIT_COOLDOWN_MS = 3000  // 3 segundos
export const MIN_FORM_FILL_TIME_MS = 5000  // mínimo 5 segundos para llenar formulario (anti-bot)
