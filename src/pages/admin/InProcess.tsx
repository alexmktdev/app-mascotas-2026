/**
 * Página: Mascotas en proceso de adopción.
 * Muestra solicitudes con acciones: aprobar, rechazar, notas.
 */

import { useState, useMemo } from 'react'
import { useAdoptionRequests, useUpdateAdoptionStatus } from '@/hooks/useAdoptions'
import { useAuth } from '@/hooks/useAuth'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AdoptionApplicantModal } from '@/components/admin/AdoptionApplicantModal'
import { ADOPTION_STATUS_LABELS, ADOPTION_STATUS_ADMIN_TABLE } from '@/constants'
import { formatRelativeDate } from '@/utils'
import type { AdoptionRequestAdminRow } from '@/types'
import { CheckCircle, XCircle, MessageSquare, Eye } from 'lucide-react'

export default function InProcess() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useAdoptionRequests({ page })
  const updateStatus = useUpdateAdoptionStatus()
  const { user } = useAuth()

  const [actionDialog, setActionDialog] = useState<{
    request: AdoptionRequestAdminRow
    action: 'approve' | 'reject'
  } | null>(null)

  const [notesDialog, setNotesDialog] = useState<AdoptionRequestAdminRow | null>(null)
  const [detailRequest, setDetailRequest] = useState<AdoptionRequestAdminRow | null>(null)

  const handleAction = async () => {
    if (!actionDialog) return
    const { request, action } = actionDialog

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    try {
      await updateStatus.mutateAsync({
        id: request.id,
        updates: {
          status: newStatus,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        },
      })
    } finally {
      setActionDialog(null)
    }
  }

  const columns = useMemo<Column<AdoptionRequestAdminRow>[]>(() => [
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
      render: (r) => (
        <span className="text-surface-700">{r.pet_name ?? '—'}</span>
      ),
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
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setDetailRequest(r)}
            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-b from-sky-500 to-sky-600 px-2.5 py-2 text-[11px] font-bold uppercase tracking-wide text-white shadow-md shadow-sky-600/30 transition hover:from-sky-600 hover:to-sky-700 sm:px-3 sm:normal-case sm:tracking-normal"
            title="Ver detalles del adoptante"
          >
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Ver</span>
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
        </div>
      ),
    },
  ], [setDetailRequest, setActionDialog, setNotesDialog])

  const paginationConfig = useMemo(() => {
    if (!data) return undefined
    return {
      currentPage: page,
      pageCount: data.pageCount,
      total: data.total,
      onPageChange: setPage,
    }
  }, [data, page])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900">Solicitudes de adopción</h1>
        <p className="text-sm text-surface-500">Revisa y gestiona las solicitudes recibidas</p>
      </div>

      <div className="xl:-mx-16 2xl:-mx-28">
        <DataTable<AdoptionRequestAdminRow>
          variant="featured"
          showLoadingSkeleton={false}
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
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
        isLoading={updateStatus.isPending}
        onConfirm={handleAction}
        onCancel={() => setActionDialog(null)}
      />

      {/* Dialog: Notas (aislado en su propio componente para no repintar esta página al escribir) */}
      {notesDialog && (
        <AdminNotesDialog request={notesDialog} onClose={() => setNotesDialog(null)} />
      )}

      {detailRequest && (
        <AdoptionApplicantModal request={detailRequest} onClose={() => setDetailRequest(null)} />
      )}
    </div>
  )
}

function AdminNotesDialog({
  request,
  onClose,
}: {
  request: AdoptionRequestAdminRow
  onClose: () => void
}) {
  const [notesInput, setNotesInput] = useState(request.admin_notes ?? '')
  const updateStatus = useUpdateAdoptionStatus()

  const handleSaveNotes = async () => {
    try {
      await updateStatus.mutateAsync({
        id: request.id,
        updates: { admin_notes: notesInput },
      })
    } finally {
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
        <Button variant="ghost" onClick={onClose} disabled={updateStatus.isPending}>Cancelar</Button>
        <Button onClick={handleSaveNotes} isLoading={updateStatus.isPending}>Guardar notas</Button>
      </div>
    </dialog>
  )
}
