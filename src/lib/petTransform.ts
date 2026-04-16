/**
 * Helpers para transformar PetFormFields → PetInsert / PetUpdate.
 * Lógica de sanitización y construcción de payloads centralizada aquí.
 */

import type { PetInsert, PetUpdate } from '@/types/firebase.types'
import type { PetFormFields } from '@/lib/validations'

export function transformPetFieldsToInsert(
  data: PetFormFields,
  userId: string | null,
  photo_urls: string[],
): PetInsert {
  const nowIso = new Date().toISOString()
  const todayDate = nowIso.slice(0, 10)
  const intake =
    data.intake_date?.trim()
      ? data.intake_date.trim()
      : todayDate

  return {
    name: data.name.trim(),
    species: data.species,
    breed: data.breed?.trim() ?? null,
    age_months: data.age_months,
    gender: data.gender,
    size: data.size ?? null,
    color: data.color?.trim() ?? null,
    contact_phone:
      data.contact_phone?.trim() && data.contact_phone.trim() !== '+56'
        ? data.contact_phone.trim()
        : null,
    weight_kg:
      data.weight_kg != null && typeof data.weight_kg === 'number' && !Number.isNaN(data.weight_kg)
        ? data.weight_kg
        : null,
    sterilized: data.sterilized,
    vaccinated: data.vaccinated,
    dewormed: data.dewormed,
    microchip: data.microchip,
    health_notes: data.health_notes?.trim() ?? null,
    personality: data.personality?.trim() ?? null,
    story: data.story?.trim() ?? null,
    special_needs: data.special_needs?.trim() ?? null,
    status: 'available',
    photo_urls,
    drive_folder_id: data.drive_folder_id?.trim() ?? null,
    intake_date: intake,
    created_by: userId ?? null,
  }
}

export function transformPetFieldsToUpdate(
  data: PetFormFields,
  userId: string | null,
  photo_urls: string[],
): PetUpdate {
  return {
    name: data.name.trim(),
    species: data.species,
    breed: data.breed?.trim() ?? null,
    age_months: data.age_months,
    gender: data.gender,
    size: data.size ?? null,
    color: data.color?.trim() ?? null,
    contact_phone:
      data.contact_phone?.trim() && data.contact_phone.trim() !== '+56'
        ? data.contact_phone.trim()
        : null,
    weight_kg:
      data.weight_kg != null && typeof data.weight_kg === 'number' && !Number.isNaN(data.weight_kg)
        ? data.weight_kg
        : null,
    sterilized: data.sterilized,
    vaccinated: data.vaccinated,
    dewormed: data.dewormed,
    microchip: data.microchip,
    health_notes: data.health_notes?.trim() ?? null,
    personality: data.personality?.trim() ?? null,
    story: data.story?.trim() ?? null,
    special_needs: data.special_needs?.trim() ?? null,
    status: data.status,
    photo_urls,
    drive_folder_id: data.drive_folder_id?.trim() ?? null,
    intake_date: data.intake_date?.trim() || undefined,
    updated_by: userId ?? null,
  }
}

export function buildCreateDefaults(): PetFormFields {
  return {
    name: '',
    species: 'dog',
    breed: '',
    age_months: 1,
    gender: 'male',
    size: undefined,
    color: '',
    contact_phone: '+56',
    weight_kg: undefined,
    sterilized: false,
    vaccinated: false,
    dewormed: false,
    microchip: false,
    health_notes: '',
    personality: '',
    story: '',
    special_needs: '',
    status: 'available',
    drive_folder_id: '',
    intake_date: '',
  }
}
