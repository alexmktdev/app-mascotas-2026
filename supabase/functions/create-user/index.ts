/**
 * Edge Function: crear usuario.
 * Solo admins pueden crear nuevos usuarios.
 * Usa service_role para gestionar Auth.
 */

import { requireAdmin } from '../_shared/requireAdmin.ts'
import { corsHeaders, readJsonBody, jsonResponse, handleHttpError, HttpError } from '../_shared/http.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { adminClient } = await requireAdmin(req)

    const { email, password, first_name, last_name, role } = await readJsonBody<{
      email?: string
      password?: string
      first_name?: string
      last_name?: string
      role?: string
    }>(req)

    if (!email || !password || !first_name || !last_name || !role) {
      throw new HttpError(400, 'Todos los campos son obligatorios')
    }

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name },
    })

    if (createError) {
      throw new HttpError(400, createError.message)
    }

    if (newUser.user) {
      await adminClient
        .from('profiles')
        .update({ role, first_name, last_name })
        .eq('id', newUser.user.id)
    }

    return jsonResponse(
      { id: newUser.user?.id, email: newUser.user?.email },
      201,
    )
  } catch (error) {
    return handleHttpError(error)
  }
})
