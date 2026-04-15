/**
 * Schemas Zod reutilizables para validación client y server.
 */

import { z } from 'zod'

// ──────────────────────────────────────────────
// Schema: Login
// ──────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Ingresa un correo válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// ──────────────────────────────────────────────
// Schema: Mascota (crear/editar)
// Las fotos van por Storage en el formulario; `photo_urls` se añade al enviar.
// ──────────────────────────────────────────────

export const petFormSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  species: z.enum(['dog', 'cat'], {
    required_error: 'Selecciona una especie',
  }),
  breed: z.string().max(100).optional().or(z.literal('')),
  age_months: z
    .number({ required_error: 'La edad es obligatoria' })
    .int('La edad debe ser un número entero')
    .min(0, 'La edad no puede ser negativa')
    .max(360, 'La edad máxima es 360 meses (30 años)'),
  gender: z.enum(['male', 'female'], {
    required_error: 'Selecciona el género',
  }),
  size: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(['small', 'medium', 'large', 'xlarge']).optional(),
  ),
  color: z.string().max(50).optional().or(z.literal('')),
  contact_phone: z.preprocess((val) => {
    if (typeof val !== 'string') return val
    const trimmed = val.trim()
    if (trimmed === '' || trimmed === '+56') return ''
    return trimmed
  }, z.string()
    .regex(/^\+56[\d\s()-]*$/, 'El teléfono debe iniciar con +56')
    .max(20, 'Máximo 20 caracteres')
    .optional()
    .or(z.literal(''))),
  weight_kg: z.preprocess((val) => {
    if (val === '' || val === undefined || val === null) return undefined
    if (typeof val === 'number' && Number.isNaN(val)) return undefined
    return val
  }, z.number().min(0, 'El peso no puede ser negativo').max(200, 'Peso máximo 200 kg').optional()),
  sterilized: z.boolean().default(false),
  vaccinated: z.boolean().default(false),
  dewormed: z.boolean().default(false),
  microchip: z.boolean().default(false),
  health_notes: z.string().max(3000, 'Máximo 3000 caracteres').optional().or(z.literal('')),
  personality: z.string().max(2000, 'Máximo 2000 caracteres').optional().or(z.literal('')),
  story: z.string().max(4000, 'Máximo 4000 caracteres').optional().or(z.literal('')),
  special_needs: z.string().max(2000, 'Máximo 2000 caracteres').optional().or(z.literal('')),
  status: z.enum(['available', 'in_process', 'adopted']).default('available'),
  drive_folder_id: z.string().optional().or(z.literal('')),
  intake_date: z.string().optional(),
})

export type PetFormFields = z.infer<typeof petFormSchema>

/** Payload final tras subir imágenes a Storage y/o conservar URLs existentes. */
export type PetFormData = PetFormFields & { photo_urls: string[] }

// ──────────────────────────────────────────────
// Schema: Solicitud de adopción (público)
// ──────────────────────────────────────────────

/** Campos del formulario público (el pet_id viene de la URL, no de un input oculto — evita fallos de validación y scroll raro al enfocar). */
export const adoptionPublicFormSchema = z.object({
  full_name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Ingresa un correo válido'),
  phone: z
    .string()
    .min(8, 'El teléfono debe tener al menos 8 dígitos')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[+\d\s()-]+$/, 'Formato de teléfono inválido'),
  id_number: z
    .string()
    .min(5, 'El número de identificación debe tener al menos 5 caracteres')
    .max(20, 'Máximo 20 caracteres'),
  address: z
    .string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(300, 'Máximo 300 caracteres'),
  city: z
    .string()
    .min(2, 'La ciudad es obligatoria')
    .max(100, 'Máximo 100 caracteres'),
  /** El <select> envía '' si no eliges tipo; el enum solo no lo aceptaba y el submit nunca corría. */
  housing_type: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(['house', 'apartment', 'farm', 'other']).optional(),
  ),
  has_yard: z.boolean().optional(),
  has_other_pets: z.boolean().optional(),
  other_pets_description: z.string().max(500).optional().or(z.literal('')),
  has_children: z.boolean().optional(),
  children_ages: z.string().max(100).optional().or(z.literal('')),
  motivation: z
    .string()
    .min(20, 'Cuéntanos más sobre tu motivación (mínimo 20 caracteres)')
    .max(2000, 'Máximo 2000 caracteres'),
  experience_with_pets: z.string().max(1000).optional().or(z.literal('')),
  work_schedule: z.string().max(300).optional().or(z.literal('')),
  // Honeypot: no usar max(0) en Zod — si un bot lo rellena, el fallo de validación enfocaba el campo oculto y movía la página.
  _honeypot: z.string().optional(),
})

export type AdoptionPublicFormData = z.infer<typeof adoptionPublicFormSchema>

/** Payload completo hacia la API (incluye pet_id). */
export const adoptionRequestSchema = adoptionPublicFormSchema.extend({
  pet_id: z.string().uuid('ID de mascota inválido'),
})

export type AdoptionRequestFormData = z.infer<typeof adoptionRequestSchema>

// ──────────────────────────────────────────────
// Schema: Crear usuario (admin)
// ──────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Ingresa un correo válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  first_name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  last_name: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  role: z.enum(['admin', 'staff'], {
    required_error: 'Selecciona un rol',
  }),
})

export type CreateUserFormData = z.infer<typeof createUserSchema>

// ──────────────────────────────────────────────
// Schema: Editar usuario (admin)
// ──────────────────────────────────────────────

export const editUserSchema = z
  .object({
    first_name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'Máximo 100 caracteres'),
    last_name: z
      .string()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(100, 'Máximo 100 caracteres'),
    email: z
      .string()
      .min(1, 'El correo es obligatorio')
      .email('Ingresa un correo válido'),
    role: z.enum(['admin', 'staff'], {
      required_error: 'Selecciona un rol',
    }),
    is_active: z.boolean(),
    password: z.string().optional(),
  })
  .refine(
    (d) => {
      const p = d.password?.trim()
      if (!p) return true
      if (p.length < 8) return false
      if (!/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/[0-9]/.test(p)) return false
      return true
    },
    {
      message:
        'Si cambias la contraseña: mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número',
      path: ['password'],
    },
  )

export type EditUserFormData = z.infer<typeof editUserSchema>

// ──────────────────────────────────────────────
// Schema: Notas de admin en solicitud
// ──────────────────────────────────────────────

export const adminNotesSchema = z.object({
  admin_notes: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
})

export type AdminNotesFormData = z.infer<typeof adminNotesSchema>

// ──────────────────────────────────────────────
// Schema: Recuperación de contraseña
// ──────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Ingresa un correo válido'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string().min(1, 'Debes confirmar la contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
