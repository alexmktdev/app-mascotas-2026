'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ROLE_LABELS } from '@/constants'
import { formatDate } from '@/utils'
import { updateUserAction, deleteUserAction } from '@/server/users-actions'
import { ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react'
import type { Profile } from '@/types/firebase.types'

interface AdminUsersTableProps {
  users: Profile[]
  currentUid: string
}

export function AdminUsersTable({ users, currentUid }: AdminUsersTableProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggleActive = useCallback(async (user: Profile) => {
    setTogglingId(user.id)
    try {
      const formData = new FormData()
      formData.set('first_name', user.first_name)
      formData.set('last_name', user.last_name)
      formData.set('email', user.email)
      formData.set('role', user.role)
      formData.set('is_active', String(!user.is_active))
      const res = await updateUserAction(user.id, formData)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      router.refresh()
    } finally {
      setTogglingId(null)
    }
  }, [router])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await deleteUserAction(deleteTarget.id)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      router.refresh()
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }, [deleteTarget, router])

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
        const isSelf = currentUid === u.id
        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => router.push(`/admin/users/${u.id}/edit`)}
              className="rounded-lg p-2 text-primary-600 transition-colors hover:bg-primary-50"
              title="Editar"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleActive(u)}
              disabled={togglingId === u.id}
              className={`rounded-lg p-2 transition-colors ${u.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-surface-400 hover:bg-surface-100'} disabled:cursor-not-allowed disabled:opacity-40`}
              title={u.is_active ? 'Desactivar' : 'Activar'}
            >
              {u.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(u)}
              disabled={isSelf}
              className="rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              title={isSelf ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )
      },
    },
  ], [currentUid, handleToggleActive, router, togglingId])

  return (
    <>
      <DataTable<Profile>
        showLoadingSkeleton={false}
        columns={columns}
        data={users}
        emptyTitle="Sin usuarios"
        emptyDescription="Crea el primer usuario para comenzar."
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar usuario"
        description={`¿Eliminar definitivamente a ${deleteTarget?.first_name} ${deleteTarget?.last_name} (${deleteTarget?.email})? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
