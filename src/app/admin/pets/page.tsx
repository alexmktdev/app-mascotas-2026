import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { fetchAdminPets } from '@/server/pets'
import { AdminPetsTable } from '@/components/next/AdminPetsTable'
import { SPECIES_LABELS } from '@/constants'
import type { Pet } from '@/types/firebase.types'

const STATUS_META: Record<string, { label: string; description: string }> = {
  available: { label: 'Disponibles', description: 'Mascotas publicadas para adopción' },
  adopted: { label: 'Adoptadas', description: 'Mascotas ya adoptadas' },
}

type SearchParams = { status?: string; species?: string; page?: string }

export default async function AdminPetsListPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  if (params.status === 'in_process') {
    redirect('/admin/in-process')
  }

  const statusFilter: Pet['status'] = params.status === 'adopted' ? 'adopted' : 'available'
  const speciesFilter = params.species === 'dog' || params.species === 'cat' ? params.species : undefined
  const page = Number(params.page ?? '1') || 1

  const result = await fetchAdminPets({ status: statusFilter, species: speciesFilter, page })

  const meta = STATUS_META[statusFilter]!

  const speciesHref = (sp: string) => {
    const qs = new URLSearchParams()
    if (statusFilter !== 'available') qs.set('status', statusFilter)
    if (sp) qs.set('species', sp)
    const s = qs.toString()
    return s ? `/admin/pets?${s}` : '/admin/pets'
  }

  const emptyCopy =
    statusFilter === 'available'
      ? { title: 'Sin mascotas disponibles', desc: 'Agrega una nueva mascota para comenzar.' }
      : { title: 'Sin mascotas adoptadas', desc: 'Las fichas adoptadas se listan aquí.' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900">{meta.label}</h1>
          <p className="text-sm text-surface-500">{meta.description}</p>
        </div>
        <Link
          href="/admin/pets/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-600/20 transition-colors hover:bg-primary-700"
        >
          <PlusCircle className="h-4 w-4" />
          Agregar
        </Link>
      </div>

      {/* Filtro especie */}
      <div className="flex gap-2">
        {['', 'dog', 'cat'].map((sp) => (
          <Link
            key={sp}
            href={speciesHref(sp)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              (speciesFilter ?? '') === sp
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20'
                : 'border border-surface-200 bg-white text-surface-600 hover:bg-surface-50'
            }`}
          >
            {sp === '' ? 'Todas las especies' : SPECIES_LABELS[sp]}
          </Link>
        ))}
      </div>

      <AdminPetsTable result={result} emptyTitle={emptyCopy.title} emptyDescription={emptyCopy.desc} />
    </div>
  )
}
