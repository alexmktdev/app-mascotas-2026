/**
 * Tests unitarios para src/lib/validations/index.ts — Schemas Zod.
 */

import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  petFormSchema,
  adoptionPublicFormSchema,
  createUserSchema,
  editUserSchema,
  adminNotesSchema,
} from '@/lib/validations'

// ──────────────────────────────────────────────
// loginSchema
// ──────────────────────────────────────────────

describe('loginSchema', () => {
  it('acepta email y password válidos', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '123456' })
    expect(result.success).toBe(true)
  })

  it('rechaza email vacío', () => {
    const result = loginSchema.safeParse({ email: '', password: '123456' })
    expect(result.success).toBe(false)
  })

  it('rechaza email inválido', () => {
    const result = loginSchema.safeParse({ email: 'not-email', password: '123456' })
    expect(result.success).toBe(false)
  })

  it('rechaza password menor a 6 caracteres', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '12345' })
    expect(result.success).toBe(false)
  })

  it('incluye mensaje de error en español', () => {
    const result = loginSchema.safeParse({ email: '', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages.some((m) => m.includes('correo'))).toBe(true)
    }
  })
})

// ──────────────────────────────────────────────
// petFormSchema
// ──────────────────────────────────────────────

describe('petFormSchema', () => {
  const validPet = {
    name: 'Luna',
    species: 'dog' as const,
    age_months: 12,
    gender: 'female' as const,
    health_notes: '',
    special_needs: '',
  }

  it('acepta datos válidos mínimos', () => {
    const result = petFormSchema.safeParse(validPet)
    expect(result.success).toBe(true)
  })

  it('rechaza nombre vacío', () => {
    const result = petFormSchema.safeParse({ ...validPet, name: '' })
    expect(result.success).toBe(false)
  })

  it('rechaza nombre mayor a 100 chars', () => {
    const result = petFormSchema.safeParse({ ...validPet, name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rechaza especie inválida', () => {
    const result = petFormSchema.safeParse({ ...validPet, species: 'bird' })
    expect(result.success).toBe(false)
  })

  it('rechaza edad negativa', () => {
    const result = petFormSchema.safeParse({ ...validPet, age_months: -1 })
    expect(result.success).toBe(false)
  })

  it('rechaza edad mayor a 360', () => {
    const result = petFormSchema.safeParse({ ...validPet, age_months: 361 })
    expect(result.success).toBe(false)
  })

  it('acepta weight_kg como undefined/vacío', () => {
    const result = petFormSchema.safeParse({ ...validPet, weight_kg: '' })
    expect(result.success).toBe(true)
  })

  it('acepta weight_kg numérico válido', () => {
    const result = petFormSchema.safeParse({ ...validPet, weight_kg: 15 })
    expect(result.success).toBe(true)
  })

  it('rechaza weight_kg negativo', () => {
    const result = petFormSchema.safeParse({ ...validPet, weight_kg: -1 })
    expect(result.success).toBe(false)
  })

  it('rechaza weight_kg mayor a 200', () => {
    const result = petFormSchema.safeParse({ ...validPet, weight_kg: 201 })
    expect(result.success).toBe(false)
  })

  it('acepta todos los tamaños válidos', () => {
    for (const size of ['small', 'medium', 'large', 'xlarge']) {
      const result = petFormSchema.safeParse({ ...validPet, size })
      expect(result.success).toBe(true)
    }
  })

  it('booleans opcionales default a false', () => {
    const result = petFormSchema.safeParse(validPet)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sterilized).toBe(false)
      expect(result.data.vaccinated).toBe(false)
      expect(result.data.dewormed).toBe(false)
      expect(result.data.microchip).toBe(false)
    }
  })

  // Regresión: size="" desde <select value=""> debe ser aceptado (preprocess → undefined)
  it('acepta size="" (vacío desde select HTML)', () => {
    const result = petFormSchema.safeParse({ ...validPet, size: '' })
    expect(result.success).toBe(true)
  })

  it('acepta size=undefined', () => {
    const result = petFormSchema.safeParse({ ...validPet, size: undefined })
    expect(result.success).toBe(true)
  })

  it('rechaza size inválido (string que no es enum)', () => {
    const result = petFormSchema.safeParse({ ...validPet, size: 'giant' })
    expect(result.success).toBe(false)
  })

  // Regresión: health_notes y special_needs deben aceptar undefined
  it('acepta health_notes undefined', () => {
    const { health_notes, ...rest } = validPet
    const result = petFormSchema.safeParse(rest)
    expect(result.success).toBe(true)
  })

  it('acepta special_needs undefined', () => {
    const { special_needs, ...rest } = validPet
    const result = petFormSchema.safeParse(rest)
    expect(result.success).toBe(true)
  })
})

// ──────────────────────────────────────────────
// adoptionPublicFormSchema
// ──────────────────────────────────────────────

describe('adoptionPublicFormSchema', () => {
  const validAdoption = {
    full_name: 'Juan Pérez López',
    email: 'juan@test.com',
    phone: '+56912345678',
    id_number: '12345678',
    address: 'Av. Libertador 1234',
    city: 'Santiago',
    motivation: 'Quiero darle un hogar a una mascota porque tengo mucho espacio y amor.',
  }

  it('acepta datos válidos', () => {
    const result = adoptionPublicFormSchema.safeParse(validAdoption)
    expect(result.success).toBe(true)
  })

  it('rechaza nombre menor a 3 chars', () => {
    const result = adoptionPublicFormSchema.safeParse({ ...validAdoption, full_name: 'AB' })
    expect(result.success).toBe(false)
  })

  it('rechaza teléfono menor a 8 dígitos', () => {
    const result = adoptionPublicFormSchema.safeParse({ ...validAdoption, phone: '12345' })
    expect(result.success).toBe(false)
  })

  it('rechaza teléfono con caracteres inválidos', () => {
    const result = adoptionPublicFormSchema.safeParse({ ...validAdoption, phone: 'abc12345678' })
    expect(result.success).toBe(false)
  })

  it('acepta teléfono con formato internacional', () => {
    const result = adoptionPublicFormSchema.safeParse({ ...validAdoption, phone: '+56 9 1234 5678' })
    expect(result.success).toBe(true)
  })

  it('rechaza motivación menor a 20 chars', () => {
    const result = adoptionPublicFormSchema.safeParse({ ...validAdoption, motivation: 'Quiero adoptar' })
    expect(result.success).toBe(false)
  })

  it('acepta housing_type vacío (preprocess a undefined)', () => {
    const result = adoptionPublicFormSchema.safeParse({ ...validAdoption, housing_type: '' })
    expect(result.success).toBe(true)
  })

  it('acepta housing_type válidos', () => {
    for (const ht of ['house', 'apartment', 'farm', 'other']) {
      const result = adoptionPublicFormSchema.safeParse({ ...validAdoption, housing_type: ht })
      expect(result.success).toBe(true)
    }
  })

  it('rechaza housing_type inválido', () => {
    const result = adoptionPublicFormSchema.safeParse({ ...validAdoption, housing_type: 'castle' })
    expect(result.success).toBe(false)
  })

  it('honeypot es opcional', () => {
    const result = adoptionPublicFormSchema.safeParse({
      ...validAdoption,
      _honeypot: 'bot-filled-this',
    })
    // El schema acepta cualquier valor; la lógica de filtrado es fuera del schema
    expect(result.success).toBe(true)
  })
})

// ──────────────────────────────────────────────
// createUserSchema
// ──────────────────────────────────────────────

describe('createUserSchema', () => {
  const validUser = {
    email: 'admin@test.com',
    password: 'Admin123',
    first_name: 'Juan',
    last_name: 'Admin',
    role: 'admin' as const,
  }

  it('acepta datos válidos', () => {
    const result = createUserSchema.safeParse(validUser)
    expect(result.success).toBe(true)
  })

  it('rechaza password sin mayúscula', () => {
    const result = createUserSchema.safeParse({ ...validUser, password: 'admin123' })
    expect(result.success).toBe(false)
  })

  it('rechaza password sin minúscula', () => {
    const result = createUserSchema.safeParse({ ...validUser, password: 'ADMIN123' })
    expect(result.success).toBe(false)
  })

  it('rechaza password sin número', () => {
    const result = createUserSchema.safeParse({ ...validUser, password: 'AdminPass' })
    expect(result.success).toBe(false)
  })

  it('rechaza password menor a 8 chars', () => {
    const result = createUserSchema.safeParse({ ...validUser, password: 'Ab1' })
    expect(result.success).toBe(false)
  })

  it('rechaza rol inválido', () => {
    const result = createUserSchema.safeParse({ ...validUser, role: 'superadmin' })
    expect(result.success).toBe(false)
  })

  it('acepta rol staff', () => {
    const result = createUserSchema.safeParse({ ...validUser, role: 'staff' })
    expect(result.success).toBe(true)
  })

  it('rechaza nombre menor a 2 chars', () => {
    const result = createUserSchema.safeParse({ ...validUser, first_name: 'A' })
    expect(result.success).toBe(false)
  })
})

// ──────────────────────────────────────────────
// editUserSchema
// ──────────────────────────────────────────────

describe('editUserSchema', () => {
  const validEdit = {
    first_name: 'Juan',
    last_name: 'Editado',
    email: 'juan@test.com',
    role: 'staff' as const,
    is_active: true,
  }

  it('acepta datos válidos sin password', () => {
    const result = editUserSchema.safeParse(validEdit)
    expect(result.success).toBe(true)
  })

  it('acepta password vacío (no cambia)', () => {
    const result = editUserSchema.safeParse({ ...validEdit, password: '' })
    expect(result.success).toBe(true)
  })

  it('acepta password válido', () => {
    const result = editUserSchema.safeParse({ ...validEdit, password: 'NewPass123' })
    expect(result.success).toBe(true)
  })

  it('rechaza password que no cumple política', () => {
    const result = editUserSchema.safeParse({ ...validEdit, password: 'weak' })
    expect(result.success).toBe(false)
  })

  it('rechaza password solo números', () => {
    const result = editUserSchema.safeParse({ ...validEdit, password: '12345678' })
    expect(result.success).toBe(false)
  })
})

// ──────────────────────────────────────────────
// adminNotesSchema
// ──────────────────────────────────────────────

describe('adminNotesSchema', () => {
  it('acepta notas vacías', () => {
    const result = adminNotesSchema.safeParse({ admin_notes: '' })
    expect(result.success).toBe(true)
  })

  it('acepta notas hasta 2000 chars', () => {
    const result = adminNotesSchema.safeParse({ admin_notes: 'a'.repeat(2000) })
    expect(result.success).toBe(true)
  })

  it('rechaza notas mayores a 2000 chars', () => {
    const result = adminNotesSchema.safeParse({ admin_notes: 'a'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('acepta undefined', () => {
    const result = adminNotesSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
