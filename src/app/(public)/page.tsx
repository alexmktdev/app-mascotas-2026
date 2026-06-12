import { Search, Heart, Shield, Phone, Dog } from 'lucide-react'
import { fetchPublicPets } from '@/server/pets'
import { PetCard } from '@/components/next/PetCard'
import { PetFilters } from '@/components/next/PetFilters'
import { PaginationLinks } from '@/components/next/PaginationLinks'
import { EmptyState } from '@/components/ui/EmptyState'
import type { PetFilters as PetFiltersType } from '@/types/firebase.types'

type SearchParams = Record<string, string | string[] | undefined>

function getAll(params: SearchParams, key: string): string[] {
  const v = params[key]
  if (v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

function getOne(params: SearchParams, key: string): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

function filtersFromSearchParams(params: SearchParams): PetFiltersType {
  const species = getOne(params, 'species')
  const page = getOne(params, 'page')

  return {
    species: species === 'dog' || species === 'cat' ? species : undefined,
    breed: getOne(params, 'breed') || undefined,
    size: getAll(params, 'size') as PetFiltersType['size'],
    gender: getAll(params, 'gender') as PetFiltersType['gender'],
    ageRange: getAll(params, 'ageRange') as PetFiltersType['ageRange'],
    health: getAll(params, 'health') as PetFiltersType['health'],
    compatibility: getAll(params, 'compatibility') as PetFiltersType['compatibility'],
    traits: getAll(params, 'traits'),
    search: getOne(params, 'search') || undefined,
    page: page ? Number(page) : 1,
  }
}

function hrefForPage(params: SearchParams, page: number): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (key === 'page' || value === undefined) continue
    for (const v of Array.isArray(value) ? value : [value]) {
      qs.append(key, v)
    }
  }
  if (page > 1) qs.set('page', String(page))
  const s = qs.toString()
  return s ? `/?${s}` : '/'
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const filters = filtersFromSearchParams(params)
  const { data, total, pageCount } = await fetchPublicPets(filters)

  return (
    <div className="animate-fade-in">
      {/* Mensaje de bienvenida */}
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-surface-900 sm:text-4xl">
          Encuentra tu compañero
          <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent"> ideal</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base text-surface-600">
          La Municipalidad de Molina te invita a darle un hogar a quienes más lo necesitan.
          Explora nuestras mascotas disponibles y adopta con responsabilidad. 🐾
        </p>
      </div>

      {/* Info cards */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-primary-100 bg-primary-50 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary-800">Adopción gratuita</p>
            <p className="text-xs text-primary-600">Todas nuestras mascotas están listas para un hogar</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800">Vacunados y esterilizados</p>
            <p className="text-xs text-emerald-600">Control veterinario garantizado</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">Seguimiento post-adopción</p>
            <p className="text-xs text-amber-600">Te acompañamos en el proceso</p>
          </div>
        </div>
      </div>

      {/* Contenido Principal con Sidebar */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Sidebar de Filtros */}
        <div className="w-full lg:w-[380px] lg:shrink-0 lg:sticky lg:top-24">
          <PetFilters />
        </div>

        {/* Listado de Mascotas */}
        <div className="flex-1">
          {data.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.map((pet, index) => (
                  <PetCard key={pet.id} pet={pet} index={index} />
                ))}
              </div>

              <PaginationLinks
                currentPage={filters.page ?? 1}
                pageCount={pageCount}
                total={total}
                hrefForPage={(page) => hrefForPage(params, page)}
              />
            </>
          ) : (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No se encontraron mascotas"
              description="Intenta cambiar los filtros o vuelve más tarde. Siempre hay nuevos amigos llegando."
            />
          )}
        </div>
      </div>

      {/* Mascota decorativa en el fondo */}
      <div className="fixed bottom-10 right-10 pointer-events-none opacity-20 hidden 2xl:block">
        <Dog className="h-40 w-40 text-primary-500 animate-bounce-slow" />
      </div>
    </div>
  )
}
