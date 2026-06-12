'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { requireStaffOrAdmin } from '@/server/auth-context'
import { ActionError, toActionErrorMessage } from '@/server/errors'
import { createPetRecord, updatePetRecord, deletePetRecord } from '@/server/pets'
import { deletePetPhotoFromR2 } from '@/server/storage-r2'
import { petFormSchema } from '@/lib/validations'

export type PetActionResult = { success: true; id?: string } | { success: false; error: string }

/** Construye el payload de datos de mascota a partir de un FormData crudo (sin confiar en su forma). */
function petPayloadFromFormData(formData: FormData): Record<string, unknown> {
  const get = (key: string) => formData.get(key)
  const getBool = (key: string) => get(key) === 'true' || get(key) === 'on'
  const getOptionalBool = (key: string): boolean | null | undefined => {
    const v = get(key)
    if (v === null) return undefined
    if (v === '') return null
    return v === 'true' || v === 'on'
  }

  const parsed = petFormSchema.parse({
    name: get('name'),
    species: get('species'),
    breed: get('breed') ?? '',
    age_months: Number(get('age_months')),
    gender: get('gender'),
    size: get('size') ?? '',
    color: get('color') ?? '',
    contact_phone: get('contact_phone') ?? '',
    weight_kg: get('weight_kg') === '' || get('weight_kg') === null ? undefined : Number(get('weight_kg')),
    sterilized: getBool('sterilized'),
    vaccinated: getBool('vaccinated'),
    dewormed: getBool('dewormed'),
    microchip: getBool('microchip'),
    health_notes: get('health_notes') ?? '',
    personality: get('personality') ?? '',
    story: get('story') ?? '',
    special_needs: get('special_needs') ?? '',
    status: get('status') ?? 'available',
    drive_folder_id: get('drive_folder_id') ?? '',
    intake_date: get('intake_date') ?? '',
  })

  const photo_urls = formData.getAll('photo_urls').filter((v): v is string => typeof v === 'string')

  return {
    ...parsed,
    good_with_kids: getOptionalBool('good_with_kids'),
    good_with_dogs: getOptionalBool('good_with_dogs'),
    good_with_cats: getOptionalBool('good_with_cats'),
    photo_urls,
  }
}

export async function createPetAction(formData: FormData): Promise<PetActionResult> {
  try {
    const session = await requireStaffOrAdmin()
    const payload = petPayloadFromFormData(formData)
    const { id } = await createPetRecord(session.uid, payload)

    revalidateTag('pets', 'max')
    revalidatePath('/admin/pets')
    revalidatePath('/')

    return { success: true, id }
  } catch (error) {
    return { success: false, error: toActionErrorMessage(error) }
  }
}

export async function updatePetAction(petId: string, formData: FormData): Promise<PetActionResult> {
  try {
    const session = await requireStaffOrAdmin()
    if (!petId) {
      throw new ActionError('invalid-argument', 'ID de mascota es requerido')
    }
    const payload = petPayloadFromFormData(formData)
    const expectedUpdatedAt = formData.get('expected_updated_at')
    if (typeof expectedUpdatedAt === 'string' && expectedUpdatedAt) {
      payload.expected_updated_at = expectedUpdatedAt
    }
    const { closedAdoptionRequestIds } = await updatePetRecord(session.uid, petId, payload)

    revalidateTag('pets', 'max')
    revalidatePath('/admin/pets')
    revalidatePath(`/pets/${petId}`)
    revalidatePath('/')

    if (closedAdoptionRequestIds.length > 0) {
      revalidateTag('adoptions', 'max')
      revalidatePath('/admin/in-process')
    }

    return { success: true, id: petId }
  } catch (error) {
    return { success: false, error: toActionErrorMessage(error) }
  }
}

export async function deletePetAction(petId: string): Promise<PetActionResult> {
  try {
    const session = await requireStaffOrAdmin()
    if (!petId) {
      throw new ActionError('invalid-argument', 'ID de mascota es requerido')
    }

    const { photoUrls } = await deletePetRecord(session.uid, petId)
    for (const url of photoUrls) {
      try {
        await deletePetPhotoFromR2(url)
      } catch {
        // El registro ya fue eliminado; un fallo al borrar la imagen de R2 no debe bloquear la operación.
      }
    }

    revalidateTag('pets', 'max')
    revalidatePath('/admin/pets')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    return { success: false, error: toActionErrorMessage(error) }
  }
}
