'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { requireStaffOrAdmin } from '@/server/auth-context'
import { ActionError, toActionErrorMessage } from '@/server/errors'
import {
  createAdoptionRequestRecord,
  updateAdoptionRequestRecord,
  deleteAdoptionRequestRecord,
} from '@/server/adoptions'
import { adoptionPublicFormSchema } from '@/lib/validations'
import { z } from 'zod'

export type AdoptionActionResult = { success: true; id?: string } | { success: false; error: string }

/**
 * Crea una solicitud de adopción. Endpoint público (sin sesión) — toda
 * validación ocurre aquí, nunca confiando en el formulario del cliente.
 */
export async function createAdoptionRequestAction(petId: string, formData: FormData): Promise<AdoptionActionResult> {
  try {
    if (!petId) {
      throw new ActionError('invalid-argument', 'ID de mascota es requerido')
    }

    // Honeypot: si un bot rellenó este campo oculto, rechazamos silenciosamente.
    if (formData.get('_honeypot')) {
      throw new ActionError('invalid-argument', 'Solicitud inválida')
    }

    const getBool = (key: string) => {
      const v = formData.get(key)
      return v === null ? undefined : v === 'true' || v === 'on'
    }

    const parsed = adoptionPublicFormSchema.parse({
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      id_number: formData.get('id_number'),
      address: formData.get('address'),
      city: formData.get('city'),
      housing_type: formData.get('housing_type') ?? '',
      has_yard: getBool('has_yard'),
      has_other_pets: getBool('has_other_pets'),
      other_pets_description: formData.get('other_pets_description') ?? '',
      has_children: getBool('has_children'),
      children_ages: formData.get('children_ages') ?? '',
      motivation: formData.get('motivation'),
      experience_with_pets: formData.get('experience_with_pets') ?? '',
      work_schedule: formData.get('work_schedule') ?? '',
    })

    const { id } = await createAdoptionRequestRecord({ ...parsed, pet_id: petId })

    revalidateTag('pets', 'max')
    revalidateTag('adoptions', 'max')
    revalidatePath(`/pets/${petId}`)
    revalidatePath('/')
    revalidatePath('/admin/adoptions')

    return { success: true, id }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? 'Datos inválidos' }
    }
    return { success: false, error: toActionErrorMessage(error) }
  }
}

const reviewSchema = z.object({
  admin_notes: z.string().max(2000).optional(),
  status: z.enum(['pending', 'reviewing', 'approved', 'rejected']).optional(),
})

export async function updateAdoptionRequestAction(
  requestId: string,
  changes: { admin_notes?: string; status?: string },
): Promise<AdoptionActionResult> {
  try {
    const session = await requireStaffOrAdmin()
    if (!requestId) {
      throw new ActionError('invalid-argument', 'ID de solicitud es requerido')
    }

    const parsed = reviewSchema.parse(changes)
    await updateAdoptionRequestRecord(session.uid, requestId, parsed)

    revalidateTag('pets', 'max')
    revalidateTag('adoptions', 'max')
    revalidatePath('/admin/adoptions')
    revalidatePath('/admin/pets')
    revalidatePath('/')

    return { success: true, id: requestId }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? 'Datos inválidos' }
    }
    return { success: false, error: toActionErrorMessage(error) }
  }
}

export async function deleteAdoptionRequestAction(requestId: string): Promise<AdoptionActionResult> {
  try {
    const session = await requireStaffOrAdmin()
    if (!requestId) {
      throw new ActionError('invalid-argument', 'ID de solicitud es requerido')
    }

    await deleteAdoptionRequestRecord(session.uid, requestId)

    revalidateTag('pets', 'max')
    revalidateTag('adoptions', 'max')
    revalidatePath('/admin/adoptions')
    revalidatePath('/admin/pets')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    return { success: false, error: toActionErrorMessage(error) }
  }
}
