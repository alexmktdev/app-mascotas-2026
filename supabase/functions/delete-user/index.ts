/**
 * Edge Function: eliminar usuario en Auth (CASCADE borra perfil). Solo admins.
 */

import { requireAdmin } from '../_shared/requireAdmin.ts'
import { corsHeaders, readJsonBody, jsonResponse, handleHttpError, HttpError } from '../_shared/http.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { adminClient, callerId } = await requireAdmin(req)

    const { user_id } = await readJsonBody<{ user_id?: string }>(req)
    if (!user_id) {
      throw new HttpError(400, 'Falta el identificador del usuario')
    }

    if (user_id === callerId) {
      throw new HttpError(400, 'No puedes eliminar tu propia cuenta')
    }

    const { data: target, error: targetErr } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single()

    if (targetErr || !target) {
      throw new HttpError(404, 'Usuario no encontrado')
    }

    if (target.role === 'admin') {
      const { count, error: cErr } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')

      if (cErr) throw new HttpError(500, 'No se pudo validar administradores')
      if ((count ?? 0) <= 1) {
        throw new HttpError(400, 'No se puede eliminar el único administrador del sistema')
      }
    }

    await adminClient.from('adoption_requests').update({ reviewed_by: null }).eq('reviewed_by', user_id)
    await adminClient.from('pets').update({ created_by: null }).eq('created_by', user_id)
    await adminClient.from('pets').update({ updated_by: null }).eq('updated_by', user_id)
    await adminClient.from('audit_log').update({ performed_by: null }).eq('performed_by', user_id)

    const { error: delError } = await adminClient.auth.admin.deleteUser(user_id)
    if (delError) {
      throw new HttpError(400, delError.message)
    }

    return jsonResponse({ ok: true }, 200)
  } catch (error) {
    return handleHttpError(error)
  }
})
