/**
 * Página: Lista de usuarios (solo admin).
 */

import { useUsers, useUpdateUser, useAdminDeleteUser } from '@/hooks/useUsers'
import { useAuth } from '@/hooks/useAuth'
import { useMemo, useCallback } from 'react'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ROLE_LABELS } from '@/constants'
import { formatDate } from '@/utils'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react'
import type { Profile } from '@/types'

export default function UsersList() {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const { data: users, isLoading, isError, refetch } = useUsers()
  const updateUser = useUpdateUser()
  const deleteUser = useAdminDeleteUser()

  const handleToggleActive = useCallback(async (user: Profile) => {
    await updateUser.mutateAsync({
      id: user.id,
      updates: { is_active: !user.is_active },
    })
  }, [updateUser])

  const handleDelete = useCallback(async (u: Profile) => {
    const ok = window.confirm(
      `¿Eliminar definitivamente a ${u.first_name} ${u.last_name} (${u.email})? Esta acción no se puede deshacer.`,
    )
    if (!ok) return
    try {
      await deleteUser.mutateAsync(u.id)
    } catch {
      // Toast en el hook
    }
  }, [deleteUser])

  const columns = useMemo<Column<Profile>[]>(() => [
    {
      key: 'name',
      header: 'Nombre',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
            {u.first_name.charAt(0)}{u.last_name.charAt(0)}
          </div>
          <span className="font-semibold text-surface-800">{u.first_name} {u.last_name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Correo',
      render: (u) => u.email,
    },
    {
      key: 'role',
      header: 'Rol',
      render: (u) => (
        <Badge variant={u.role === 'admin' ? 'info' : 'default'}>
          {ROLE_LABELS[u.role]}
        </Badge>
      ),
    },
    {
      key: 'active',
      header: 'Estado',
      render: (u) => (
        <Badge variant={u.is_active ? 'success' : 'danger'}>
          {u.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Registro',
      render: (u) => formatDate(u.created_at),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (u) => {
        const isSelf = authUser?.id === u.id
        return (
          <div className="flex items-center gap-1">
            <Link
              to={`/admin/users/${u.id}/edit`}
              className="rounded-lg p-2 text-primary-600 transition-colors hover:bg-primary-50"
              title="Editar"
            >
              <Pencil className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={() => handleToggleActive(u)}
              className={`rounded-lg p-2 transition-colors ${u.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-surface-400 hover:bg-surface-100'}`}
              title={u.is_active ? 'Desactivar' : 'Activar'}
            >
              {u.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(u)}
              disabled={isSelf || deleteUser.isPending}
              className="rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              title={isSelf ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )
      },
    },
  ], [authUser?.id, deleteUser.isPending, handleToggleActive, handleDelete])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900">Usuarios</h1>
          <p className="text-sm text-surface-500">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={() => navigate('/admin/users/new')}>
          <UserPlus className="h-4 w-4" />
          Crear usuario
        </Button>
      </div>

      <DataTable<Profile>
        showLoadingSkeleton={false}
        columns={columns}
        data={users ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        emptyTitle="Sin usuarios"
        emptyDescription="Crea el primer usuario para comenzar."
      />
    </div>
  )
}
