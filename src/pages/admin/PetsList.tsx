/**
 * Lista de mascotas disponibles (admin).
 */

import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminPets, useDeletePet } from '@/hooks/usePets'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

import { Button } from '@/components/ui/Button'
import { SPECIES_LABELS, PET_STATUS_LABELS, PET_STATUS_ADMIN_TABLE, SPECIES_EMOJI } from '@/constants'
import { formatAge, formatDate } from '@/utils'
import { PetPhotoImage } from '@/components/pets/PetPhotoImage'
import { Pencil, Trash2, PlusCircle } from 'lucide-react'
import type { Pet } from '@/types'

export default function PetsList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [speciesFilter, setSpeciesFilter] = useState<string>('')
  const { data, isLoading, isError, refetch } = useAdminPets({
    status: 'available',
    species: speciesFilter as Pet['species'] || undefined,
    page,
  })
  const deletePet = useDeletePet()
  const [deleteTarget, setDeleteTarget] = useState<Pet | null>(null)

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deletePet.mutateAsync({
        id: deleteTarget.id,
        photoUrls: deleteTarget.photo_urls,
      })
    } catch {
      // Toast en useDeletePet
    } finally {
      setDeleteTarget(null)
    }
  }, [deleteTarget, deletePet])

  const columns = useMemo<Column<Pet>[]>(() => [
    {
      key: 'photo',
      header: 'Foto',
      className: 'w-14',
      render: (pet) => (
        <div className="h-10 w-10 overflow-hidden rounded-lg bg-surface-100">
          {pet.photo_urls?.length > 0 ? (
            <PetPhotoImage photoRef={pet.photo_urls[0]!} alt={pet.name} className="h-full w-full object-cover" />
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
          <button
            type="button"
            onClick={() => navigate(`/admin/pets/${pet.id}/edit`)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-primary-500 to-primary-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-primary-600/25 transition hover:from-primary-600 hover:to-primary-700 hover:shadow-lg"
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Editar</span>
          </button>
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
  ], [navigate, setDeleteTarget])

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900">Mascotas disponibles</h1>
          <p className="text-sm text-surface-500">Gestiona las mascotas en estado disponible</p>
        </div>
        <Button onClick={() => navigate('/admin/pets/new')}>
          <PlusCircle className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      {/* Filtro rápido */}
      <div className="flex gap-2">
        {['', 'dog', 'cat'].map((sp) => (
          <Button
            key={sp}
            variant={speciesFilter === sp ? 'primary' : 'outline'}
            size="sm"
            onClick={() => { setSpeciesFilter(sp); setPage(1) }}
          >
            {sp === '' ? 'Todas' : SPECIES_LABELS[sp]}
          </Button>
        ))}
      </div>

      <DataTable<Pet>
        variant="featured"
        showLoadingSkeleton={false}
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        emptyTitle="Sin mascotas disponibles"
        emptyDescription="Agrega una nueva mascota para comenzar."
        pagination={paginationConfig}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Eliminar mascota"
        description={`¿Estás seguro de que deseas eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={deletePet.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
