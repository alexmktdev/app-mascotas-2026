/**
 * Valida JWT del caller y exige rol admin. Usado por Edge Functions de gestión de usuarios.
 */

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { HttpError } from './http.ts'

export async function requireAdmin(req: Request): Promise<{
  adminClient: SupabaseClient
  callerId: string
}> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.trim()) {
    throw new HttpError(401, 'No se proporcionó token de autorización')
  }

  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!jwt) {
    throw new HttpError(401, 'Token de autorización vacío')
  }

  const verifyClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Usamos getUser para verificar el token de forma oficial y segura en el servidor
  const { data: { user }, error: authError } = await verifyClient.auth.getUser(jwt)

  if (authError || !user) {
    throw new HttpError(
      401,
      `Token inválido o expirado: ${authError?.message || 'usuario no encontrado'}`,
    )
  }

  const callerId = user.id

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', callerId)
    .single()

  if (profile?.role !== 'admin') {
    throw new HttpError(403, 'No tienes permisos de administrador')
  }

  return { adminClient, callerId }
}
