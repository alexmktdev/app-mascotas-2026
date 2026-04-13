/**
 * API de usuarios/perfiles — Funciones que llaman a Supabase.
 */

import { supabase } from '@/lib/supabase'
import type { Profile, ProfileUpdate } from '@/types'

// ──────────────────────────────────────────────
// Admin: listar todos los usuarios
// ──────────────────────────────────────────────

export async function fetchUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// ──────────────────────────────────────────────
// Admin: un usuario por id
// ──────────────────────────────────────────────

export async function fetchUserById(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role, is_active, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ──────────────────────────────────────────────
// Admin: actualizar perfil de usuario (campos parciales, cliente directo)
// ──────────────────────────────────────────────

export async function updateUser(id: string, updates: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('id, first_name, last_name, email, role, is_active, created_at, updated_at')
    .single()

  if (error) throw error
  return data
}

// ──────────────────────────────────────────────
// Edge Functions (admin): sesión + invoke
// ──────────────────────────────────────────────

async function getSessionAccessToken(): Promise<string> {
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
  let session = refreshed.session

  if (!session?.access_token && !refreshError) {
    const { data: { session: stored } } = await supabase.auth.getSession()
    session = stored ?? null
  }

  if (!session?.access_token) {
    throw new Error(
      refreshError
        ? 'Tu sesión expiró o no es válida. Cierra sesión y vuelve a entrar.'
        : 'No hay sesión activa. Por favor, reingresa al sistema.',
    )
  }

  return session.access_token
}

async function invokeUserEdgeFunction<T>(name: string, body: object): Promise<T> {
  const accessToken = await getSessionAccessToken()

  const { data, error } = await supabase.functions.invoke<T>(name, {
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (error) {
    let errorMessage = 'Error en el servidor'

    if (error.context && typeof error.context.json === 'function') {
      try {
        const errBody = await error.context.json()
        errorMessage = errBody.error || errBody.message || error.message
      } catch {
        errorMessage = error.message
      }
    } else {
      errorMessage = error.message
    }

    throw new Error(errorMessage)
  }

  if (data === null || data === undefined) {
    throw new Error('La función no devolvió datos')
  }

  return data
}

// ──────────────────────────────────────────────
// Admin: crear usuario (vía Edge Function)
// ──────────────────────────────────────────────

export interface CreateUserPayload {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'admin' | 'staff'
}

export interface CreateUserResponse {
  id: string
  email: string
}

export async function createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
  return invokeUserEdgeFunction<CreateUserResponse>('create-user', payload)
}

// ──────────────────────────────────────────────
// Admin: editar usuario (Auth + profiles vía Edge Function)
// ──────────────────────────────────────────────

export interface UpdateUserAdminPayload {
  user_id: string
  first_name: string
  last_name: string
  email: string
  role: 'admin' | 'staff'
  is_active: boolean
  /** Si se omite o está vacío, no se cambia la contraseña */
  password?: string
}

export async function updateUserAdmin(payload: UpdateUserAdminPayload): Promise<{ ok: boolean }> {
  const body: UpdateUserAdminPayload = {
    user_id: payload.user_id,
    first_name: payload.first_name,
    last_name: payload.last_name,
    email: payload.email,
    role: payload.role,
    is_active: payload.is_active,
  }
  const trimmed = payload.password?.trim()
  if (trimmed) {
    body.password = trimmed
  }
  return invokeUserEdgeFunction<{ ok: boolean }>('update-user', body)
}

// ──────────────────────────────────────────────
// Admin: eliminar usuario (Auth; CASCADE en profiles)
// ──────────────────────────────────────────────

export async function deleteUserAdmin(userId: string): Promise<{ ok: boolean }> {
  return invokeUserEdgeFunction<{ ok: boolean }>('delete-user', { user_id: userId })
}
