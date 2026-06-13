'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PetPhotoImage } from '@/components/next/PetPhotoImage'
import { SPECIES_LABELS, PET_STATUS_LABELS, PET_STATUS_ADMIN_TABLE, SPECIES_EMOJI } from '@/constants'
import { formatAge, formatDate } from '@/utils'
import { deletePetAction } from '@/server/pets-actions'
import { Pencil, Trash2 } from 'lucide-react'
import type { Pet, PaginatedResponse } from '@/types/firebase.types'

interface AdminPetsTableProps {
  result: PaginatedResponse<Pet>
  emptyTitle: string
  emptyDescription: string
}

export function AdminPetsTable({ result, emptyTitle, emptyDescription }: AdminPetsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [deleteTarget, setDeleteTarget] = useState<Pet | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const currentPage = Number(searchParams.get('page') ?? '1') || 1

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

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await deletePetAction(deleteTarget.id)
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

  const columns = useMemo<Column<Pet>[]>(() => [
    {
      key: 'photo',
      header: 'Foto',
      className: 'w-14',
      render: (pet) => (
        <div className="h-10 w-10 overflow-hidden rounded-lg bg-surface-100">
          {pet.photo_urls?.length > 0 ? (
            <PetPhotoImage src={pet.photo_urls[0]!} alt={pet.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg">
              {SPECIES_EMOJI[pet.species]}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (pet) => <span className="font-semibold text-surface-800">{pet.name}</span>,
    },
    {
      key: 'species',
      header: 'Especie',
      render: (pet) => SPECIES_LABELS[pet.species],
    },
    {
      key: 'breed',
      header: 'Raza',
      render: (pet) => pet.breed || '—',
    },
    {
      key: 'age',
      header: 'Edad',
      render: (pet) => formatAge(pet.age_months),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (pet) => (
        <span className={`inline-flex items-center rounded-full ${PET_STATUS_ADMIN_TABLE[pet.status] ?? ''}`}>
          {PET_STATUS_LABELS[pet.status]}
        </span>
      ),
    },
    {
      key: 'intake',
      header: 'Ingreso',
      render: (pet) => formatDate(pet.intake_date),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-[13rem]',
      render: (pet) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          {pet.status !== 'adopted' && (
            <button
              type="button"
              onClick={() => router.push(`/admin/pets/${pet.id}/edit`)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-primary-500 to-primary-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-primary-600/25 transition hover:from-primary-600 hover:to-primary-700 hover:shadow-lg"
              aria-label="Editar"
            >
              <Pencil className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Editar</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setDeleteTarget(pet)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-rose-500 to-rose-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/25 transition hover:from-rose-600 hover:to-rose-700 hover:shadow-lg"
            aria-label="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      ),
    },
  ], [router])

  const paginationConfig = useMemo(() => ({
    currentPage,
    pageCount: result.pageCount,
    total: result.total,
    onPageChange: goToPage,
  }), [currentPage, result.pageCount, result.total, goToPage])

  return (
    <>
      <DataTable<Pet>
        variant="featured"
        showLoadingSkeleton={false}
        columns={columns}
        data={result.data}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        pagination={paginationConfig}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar mascota"
        description={`¿Estás seguro de que deseas eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
