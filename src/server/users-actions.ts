'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/server/auth-context'
import { ActionError, toActionErrorMessage } from '@/server/errors'
import { createUserRecord, updateUserRecord, deleteUserRecord } from '@/server/users'
import { createUserSchema, editUserSchema } from '@/lib/validations'

export type UserActionResult = { success: true; id?: string } | { success: false; error: string }

export async function createUserAction(formData: FormData): Promise<UserActionResult> {
  try {
    const session = await requireAdmin()

    const parsed = createUserSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      role: formData.get('role'),
    })

    const { uid } = await createUserRecord(session.uid, parsed)

    revalidateTag('users', 'max')
    revalidatePath('/admin/users')

    return { success: true, id: uid }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? 'Datos inválidos' }
    }
    return { success: false, error: toActionErrorMessage(error) }
  }
}

export async function updateUserAction(uid: string, formData: FormData): Promise<UserActionResult> {
  try {
    const session = await requireAdmin()
    if (!uid) {
      throw new ActionError('invalid-argument', 'UID es requerido')
    }

    const parsed = editUserSchema.parse({
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      role: formData.get('role'),
      is_active: formData.get('is_active') === 'true' || formData.get('is_active') === 'on',
      password: formData.get('password') ?? '',
    })

    const { password, ...rest } = parsed
    const trimmedPassword = password?.trim()

    await updateUserRecord(session.uid, uid, {
      ...rest,
      ...(trimmedPassword ? { password: trimmedPassword } : {}),
    })

    revalidateTag('users', 'max')
    revalidatePath('/admin/users')

    return { success: true, id: uid }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? 'Datos inválidos' }
    }
    return { success: false, error: toActionErrorMessage(error) }
  }
}

export async function deleteUserAction(uid: string): Promise<UserActionResult> {
  try {
    const session = await requireAdmin()
    if (!uid) {
      throw new ActionError('invalid-argument', 'UID es requerido')
    }

    await deleteUserRecord(session.uid, uid)

    revalidateTag('users', 'max')
    revalidatePath('/admin/users')

    return { success: true }
  } catch (error) {
    return { success: false, error: toActionErrorMessage(error) }
  }
}
