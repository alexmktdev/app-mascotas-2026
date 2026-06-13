'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AdoptionApplicantModal } from '@/components/next/AdoptionApplicantModal'
import { ADOPTION_STATUS_LABELS, ADOPTION_STATUS_ADMIN_TABLE } from '@/constants'
import { formatRelativeDate } from '@/utils'
import { updateAdoptionRequestAction, deleteAdoptionRequestAction } from '@/server/adoptions-actions'
import type { AdminAdoptionRow, PaginatedResponse } from '@/types/firebase.types'
import { CheckCircle, XCircle, MessageSquare, Eye, Pencil, Trash2 } from 'lucide-react'

interface AdminAdoptionsTableProps {
  result: PaginatedResponse<AdminAdoptionRow>
}

export function AdminAdoptionsTable({ result }: AdminAdoptionsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentPage = Number(searchParams.get('page') ?? '1') || 1

  const [actionDialog, setActionDialog] = useState<{
    request: AdminAdoptionRow
    action: 'approve' | 'reject'
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const [notesDialog, setNotesDialog] = useState<AdminAdoptionRow | null>(null)
  const [editDialog, setEditDialog] = useState<AdminAdoptionRow | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<AdminAdoptionRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [detailRequest, setDetailRequest] = useState<AdminAdoptionRow | null>(null)

  const goToPage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(page))
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }, [router, pathname, searchParams])

  const handleAction = async () => {
    if (!actionDialog) return
    const { request, action } = actionDialog
    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    setActionLoading(true)
    try {
      const res = await updateAdoptionRequestAction(request.id, { status: newStatus })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      toast.success(
        action === 'approve'
          ? `Solicitud aprobada. ${request.pet_name ?? 'La mascota'} fue marcada como adoptada.`
          : 'Solicitud rechazada.',
      )
      router.refresh()
    } finally {
      setActionLoading(false)
      setActionDialog(null)
    }
  }

  const columns = useMemo<Column<AdminAdoptionRow>[]>(() => [
    {
      key: 'full_name',
      header: 'Solicitante',
      className: 'w-[18%]',
      render: (r) => <span className="font-semibold text-surface-800">{r.full_name}</span>,
    },
    {
      key: 'pet_name',
      header: 'Mascota',
      className: 'w-[12%]',
      render: (r) => <span className="text-surface-700">{r.pet_name ?? '—'}</span>,
    },
    {
      key: 'email',
      header: 'Correo',
      className: 'w-[20%]',
      render: (r) => r.email,
    },
    {
      key: 'phone',
      header: 'Teléfono',
      className: 'w-[11%] whitespace-nowrap',
      render: (r) => r.phone,
    },
    {
      key: 'status',
      header: 'Estado',
      className: 'w-[10%] whitespace-nowrap',
      render: (r) => (
        <span className={`inline-flex items-center rounded-full ${ADOPTION_STATUS_ADMIN_TABLE[r.status] ?? ''}`}>
          {ADOPTION_STATUS_LABELS[r.status]}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Fecha',
      className: 'w-[13%] whitespace-nowrap',
      render: (r) => <span className="whitespace-nowrap">{formatRelativeDate(r.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-[16%]',
      render: (r) => (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDetailRequest(r)}
            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-b from-sky-500 to-sky-600 px-2.5 py-2 text-[11px] font-bold uppercase tracking-wide text-white shadow-md shadow-sky-600/30 transition hover:from-sky-600 hover:to-sky-700 sm:px-3 sm:normal-case sm:tracking-normal"
            title="Ver detalles del adoptante"
          >
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Ver</span>
          </button>
          <button
            type="button"
            onClick={() => setEditDialog(r)}
            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-b from-primary-500 to-primary-600 px-2.5 py-2 text-[11px] font-bold text-white shadow-md shadow-primary-600/30 transition hover:from-primary-600 hover:to-primary-700 sm:px-3"
            title="Editar solicitud"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Editar</span>
          </button>
          {r.status === 'pending' || r.status === 'reviewing' ? (
            <>
              <button
                type="button"
                onClick={() => setActionDialog({ request: r, action: 'approve' })}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-2.5 py-2 text-[11px] font-bold text-white shadow-md shadow-emerald-600/30 transition hover:from-emerald-600 hover:to-emerald-700 sm:px-3"
                title="Aprobar solicitud"
              >
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Aprobar</span>
              </button>
              <button
                type="button"
                onClick={() => setActionDialog({ request: r, action: 'reject' })}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-b from-rose-500 to-rose-600 px-2.5 py-2 text-[11px] font-bold text-white shadow-md shadow-rose-600/30 transition hover:from-rose-600 hover:to-rose-700 sm:px-3"
                title="Rechazar solicitud"
              >
                <XCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Rechazar</span>
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setNotesDialog(r)}
            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 px-2.5 py-2 text-[11px] font-bold text-amber-950 shadow-md shadow-amber-600/25 transition hover:from-amber-500 hover:to-amber-600 sm:px-3"
            title="Notas de administrador"
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Notas</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleteDialog(r)}
            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-b from-rose-500 to-rose-600 px-2.5 py-2 text-[11px] font-bold text-white shadow-md shadow-rose-600/30 transition hover:from-rose-600 hover:to-rose-700 sm:px-3"
            title="Eliminar solicitud"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      ),
    },
  ], [])

  const paginationConfig = useMemo(() => ({
    currentPage,
    pageCount: result.pageCount,
    total: result.total,
    onPageChange: goToPage,
  }), [currentPage, result.pageCount, result.total, goToPage])

  return (
    <>
      <div className="xl:-mx-16 2xl:-mx-28">
        <DataTable<AdminAdoptionRow>
          variant="featured"
          showLoadingSkeleton={false}
          columns={columns}
          data={result.data}
          emptyTitle="Sin solicitudes"
          emptyDescription="Aún no se han recibido solicitudes de adopción."
          pagination={paginationConfig}
        />
      </div>

      {/* Dialog: Aprobar/Rechazar */}
      <ConfirmDialog
        isOpen={!!actionDialog}
        title={actionDialog?.action === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
        description={
          actionDialog?.action === 'approve'
            ? `¿Aprobar la solicitud de "${actionDialog.request.full_name}"? La mascota será marcada como adoptada.`
            : `¿Rechazar la solicitud de "${actionDialog?.request.full_name}"?`
        }
        confirmLabel={actionDialog?.action === 'approve' ? 'Aprobar' : 'Rechazar'}
        variant={actionDialog?.action === 'approve' ? 'primary' : 'danger'}
        isLoading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => setActionDialog(null)}
      />

      {notesDialog && (
        <AdminNotesDialog request={notesDialog} onClose={() => setNotesDialog(null)} onSaved={() => router.refresh()} />
      )}

      {editDialog && (
        <AdoptionEditDialog request={editDialog} onClose={() => setEditDialog(null)} onSaved={() => router.refresh()} />
      )}

      {detailRequest && (
        <AdoptionApplicantModal request={detailRequest} onClose={() => setDetailRequest(null)} />
      )}

      <ConfirmDialog
        isOpen={!!deleteDialog}
        title="Eliminar solicitud"
        description={`¿Deseas eliminar la solicitud de "${deleteDialog?.full_name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={async () => {
          if (!deleteDialog) return
          setDeleteLoading(true)
          try {
            const res = await deleteAdoptionRequestAction(deleteDialog.id)
            if (!res.success) {
              toast.error(res.error)
              return
            }
            toast.success('Solicitud eliminada.')
            router.refresh()
          } finally {
            setDeleteLoading(false)
            setDeleteDialog(null)
          }
        }}
        onCancel={() => setDeleteDialog(null)}
      />
    </>
  )
}

function AdminNotesDialog({
  request,
  onClose,
  onSaved,
}: {
  request: AdminAdoptionRow
  onClose: () => void
  onSaved: () => void
}) {
  const [notesInput, setNotesInput] = useState(request.admin_notes ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveNotes = async () => {
    setIsSaving(true)
    try {
      const res = await updateAdoptionRequestAction(request.id, { admin_notes: notesInput })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      onSaved()
    } finally {
      setIsSaving(false)
      onClose()
    }
  }

  return (
    <dialog open className="fixed inset-0 z-50 m-auto w-[min(92vw,56rem)] rounded-2xl border-0 bg-white p-8 shadow-2xl backdrop:bg-black/50 animate-scale-in">
      <h3 className="mb-5 text-xl font-bold text-surface-900">Notas de administrador</h3>
      <textarea
        value={notesInput}
        onChange={(e) => setNotesInput(e.target.value)}
        rows={10}
        className="mb-5 min-h-[22rem] w-full rounded-xl border border-surface-200 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        placeholder="Escribe notas internas..."
      />
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
        <Button onClick={handleSaveNotes} isLoading={isSaving}>Guardar notas</Button>
      </div>
    </dialog>
  )
}

function AdoptionEditDialog({
  request,
  onClose,
  onSaved,
}: {
  request: AdminAdoptionRow
  onClose: () => void
  onSaved: () => void
}) {
  const [status, setStatus] = useState(request.status)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await updateAdoptionRequestAction(request.id, { status })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      onSaved()
    } finally {
      setIsSaving(false)
      onClose()
    }
  }

  return (
    <dialog open className="fixed inset-0 z-50 m-auto w-[min(92vw,40rem)] rounded-2xl border-0 bg-white p-6 shadow-2xl backdrop:bg-black/50 animate-scale-in">
      <h3 className="mb-4 text-xl font-bold text-surface-900">Editar estado de solicitud</h3>
      <div className="space-y-4">
        <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
          <p className="text-sm text-surface-600">
            <span className="font-semibold">Solicitante:</span> {request.full_name}
          </p>
          <p className="text-sm text-surface-600">
            <span className="font-semibold">Mascota:</span> {request.pet_name ?? '—'}
          </p>
        </div>
        <label className="space-y-1 text-sm text-surface-700">
          <span className="font-medium">Estado de la solicitud</span>
          <select
            className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            value={status}
            onChange={(e) => setStatus(e.target.value as AdminAdoptionRow['status'])}
          >
            <option value="pending">Pendiente</option>
            <option value="reviewing">En revisión</option>
            <option value="approved">Aprobado</option>
            <option value="rejected">Rechazado</option>
          </select>
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
        <Button onClick={handleSave} isLoading={isSaving}>Guardar cambios</Button>
      </div>
    </dialog>
  )
}
