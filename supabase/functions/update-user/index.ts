/**
 * Edge Function: actualizar usuario (Auth + profiles). Solo admins.
 */

import { requireAdmin } from '../_shared/requireAdmin.ts'
import { corsHeaders, readJsonBody, jsonResponse, handleHttpError, HttpError } from '../_shared/http.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { adminClient } = await requireAdmin(req)

    const body = await readJsonBody<{
      user_id?: string
      first_name?: string
      last_name?: string
      email?: string
      role?: 'admin' | 'staff'
      is_active?: boolean
      password?: string
    }>(req)

    const {
      user_id,
      first_name,
      last_name,
      email,
      role,
      is_active,
      password,
    } = body

    if (!user_id || !first_name || !last_name || !email || !role || typeof is_active !== 'boolean') {
      throw new HttpError(400, 'Faltan campos obligatorios')
    }

    const { data: target, error: targetErr } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', user_id)
      .single()

    if (targetErr || !target) {
      throw new HttpError(404, 'Usuario no encontrado')
    }

    if (target.role === 'admin' && role === 'staff') {
      const { count, error: cErr } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')

      if (cErr) throw new HttpError(500, 'No se pudo validar administradores')
      if ((count ?? 0) <= 1) {
        throw new HttpError(400, 'Debe existir al menos un administrador en el sistema')
      }
    }

    const authUpdate: {
      email?: string
      password?: string
      user_metadata?: { first_name: string; last_name: string }
    } = {
      user_metadata: { first_name, last_name },
    }

    if (typeof email === 'string' && email.length > 0) {
      authUpdate.email = email
    }

    if (password && String(password).length > 0) {
      authUpdate.password = password
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(user_id, authUpdate)
    if (authError) {
      throw new HttpError(400, authError.message)
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        first_name,
        last_name,
        email,
        role,
        is_active,
      })
      .eq('id', user_id)

    if (profileError) {
      throw new HttpError(400, profileError.message)
    }

    return jsonResponse({ ok: true }, 200)
  } catch (error) {
    return handleHttpError(error)
  }
})
