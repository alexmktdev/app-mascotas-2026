/**
 * Página principal — Banner Molina + mascotas disponibles.
 */

import { useState, useCallback } from 'react'
import { usePets } from '@/hooks/usePets'
import { PetCard } from '@/components/pets/PetCard'
import { PetFilters } from '@/components/pets/PetFilters'
import { PetCardSkeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import type { PetFilters as PetFiltersType } from '@/types'
import { Search, Heart, Shield, Phone, Dog } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function Home() {
  const [filters, setFilters] = useState<PetFiltersType>({ page: 1 })
  const { data, isLoading, error } = usePets(filters)

  const handleFiltersChange = useCallback((newFilters: PetFiltersType) => {
    setFilters(newFilters)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

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
          <PetFilters onFiltersChange={handleFiltersChange} />
        </div>

        {/* Listado de Mascotas */}
        <div className="flex-1">
          {/* Caso 1: Error Crítico (Prioridad 1) */}
          {error ? (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-rose-900">No se pudo cargar la galería</h3>
              <p className="mb-6 text-sm text-rose-700">{(error as Error).message}</p>
              <Button variant="primary" onClick={() => window.location.reload()}>
                Recargar página
              </Button>
            </div>
          ) : isLoading && !data ? (
            /* Caso 2: Carga Inicial (Sin datos previos) */
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <PetCardSkeleton key={i} />
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            /* Caso 3: Éxito (Con datos) */
            <>
              <div className={`grid gap-6 sm:grid-cols-2 xl:grid-cols-3 transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {data.data.map((pet, index) => (
                  <PetCard key={pet.id} pet={pet} index={index} />
                ))}
              </div>

              <Pagination
                currentPage={filters.page ?? 1}
                pageCount={data.pageCount}
                total={data.total}
                onPageChange={handlePageChange}
                variant="public"
              />
            </>
          ) : (
            /* Caso 4: Vacío (Sin resultados tras cargar con éxito) */
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No se encontraron mascotas"
              description="Intenta cambiar los filtros o vuelve más tarde. Siempre hay nuevos amigos llegando."
              actionLabel="Limpiar filtros"
              onAction={() => setFilters({ page: 1 })}
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
