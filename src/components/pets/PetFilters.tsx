/**
 * Filtros de mascotas — Sidebar vertical.
 * Basado en el diseño municipal solicitado.
 */

import { useSearchParams } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Cat, Search } from 'lucide-react'
import {
  SPECIES_LABELS,
  DOG_BREEDS,
  CAT_BREEDS,
} from '@/constants'
import type { PetFilters as PetFiltersType } from '@/types/firebase.types'

interface PetFiltersProps {
  onFiltersChange: (filters: PetFiltersType) => void
}

export function PetFilters({ onFiltersChange }: PetFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Leer filtros actuales de URL
  const currentFilters = useMemo<PetFiltersType>(() => {
    const species = searchParams.get('species') as 'dog' | 'cat' | null
    return {
      species: species || undefined,
      breed: searchParams.get('breed') || undefined,
      size: searchParams.getAll('size') as any,
      gender: searchParams.getAll('gender') as any,
      ageRange: searchParams.getAll('ageRange') as any,
      health: searchParams.getAll('health') as any,
      compatibility: searchParams.getAll('compatibility') as any,
      traits: searchParams.getAll('traits') as any,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    }
  }, [searchParams])

  // Notificar cambios al padre (Home)
  useEffect(() => {
    onFiltersChange(currentFilters)
  }, [currentFilters, onFiltersChange])

  // Estado local para el buscador de texto con debounce (evitar re-renders masivos)
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

  // Efecto debounce para aplicar búsqueda de texto
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      const currentParam = params.get('search') || ''
      const trimmed = searchValue.trim()
      
      if (trimmed !== currentParam) {
        if (trimmed) {
          params.set('search', trimmed)
        } else {
          params.delete('search')
        }
        params.delete('page') // Reset paginación al buscar
        setSearchParams(params, { replace: true, preventScrollReset: true })
      }
    }, 450)
    return () => clearTimeout(timer)
  }, [searchValue, searchParams, setSearchParams])

  // Escuchar si se limpian los filtros desde el botón "Limpiar todo"
  useEffect(() => {
    if (!searchParams.has('search')) setSearchValue('')
  }, [searchParams])

  const updateParam = useCallback((key: string, value: string, isChecked: boolean, isMulti = true) => {
    const params = new URLSearchParams(searchParams)
    
    if (isMulti) {
      const currentValues = params.getAll(key)
      if (isChecked) {
        if (!currentValues.includes(value)) params.append(key, value)
      } else {
        params.delete(key)
        currentValues.filter(v => v !== value).forEach(v => params.append(key, v))
      }
    } else {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    
    params.delete('page') // Reset paginación
    setSearchParams(params, { replace: true, preventScrollReset: true })
  }, [searchParams, setSearchParams])

  const clearFilters = () => {
    setSearchParams({}, { replace: true, preventScrollReset: true })
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="mb-3 text-sm font-bold text-surface-900">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  )

  const Checkbox = ({ label, value, group }: { label: string; value: string; group: string }) => {
    const isChecked = searchParams.getAll(group).includes(value)
    return (
      <label className="flex cursor-pointer items-center gap-2.5 group">
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => updateParam(group, value, e.target.checked)}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-surface-300 bg-white transition-all checked:border-primary-600 checked:bg-primary-600 focus:ring-2 focus:ring-primary-500/20"
          />
          <svg className="absolute h-3.5 w-3.5 scale-0 text-white transition-transform peer-checked:scale-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span className="text-sm font-medium text-surface-600 transition-colors group-hover:text-surface-900">
          {label}
        </span>
      </label>
    )
  }

  return (
    <aside className="relative w-full rounded-2xl border border-surface-200 bg-white p-6 shadow-sm shadow-surface-200/50 lg:sticky lg:top-28 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-6 custom-scrollbar">
      {/* Mascota decorativa asomándose */}
      <div className="absolute -top-12 right-4 pointer-events-none opacity-40">
        <Cat className="h-16 w-16 text-primary-400 -rotate-12 animate-pulse" />
      </div>
      <div className="flex items-center justify-between mb-8 border-b border-surface-100 pb-4">
        <h2 className="text-xl font-extrabold text-surface-900">Filtros</h2>
        {searchParams.toString() !== '' && (
          <button 
            onClick={clearFilters}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 uppercase tracking-wider"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Buscar por Nombre */}
      <div className="mb-6 relative">
        <label htmlFor="pet-search" className="sr-only">Buscar por nombre</label>
        <div className="relative">
          <input
            id="pet-search"
            type="text"
            placeholder="Buscar por nombre..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2.5 pl-10 pr-4 text-sm font-medium text-surface-900 transition-colors focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 placeholder:text-surface-400"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
        </div>
      </div>

      {/* Especie - El primer filtro siempre es importante */}
      <Section title="Especie">
        <div className="flex gap-2">
          {Object.entries(SPECIES_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => updateParam('species', value, true, false)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                currentFilters.species === value 
                  ? 'border-primary-600 bg-primary-50 text-primary-600' 
                  : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
              }`}
            >
              {label}s
            </button>
          ))}
        </div>
      </Section>

      {/* Raza */}
      <Section title="Raza">
        <select
          value={currentFilters.breed ?? ''}
          onChange={(e) => updateParam('breed', e.target.value, true, false)}
          className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-700 shadow-sm focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">Selecciona una raza</option>
          {(currentFilters.species === 'dog' ? DOG_BREEDS : currentFilters.species === 'cat' ? CAT_BREEDS : [...DOG_BREEDS, ...CAT_BREEDS]).map(breed => (
            <option key={breed} value={breed}>{breed}</option>
          ))}
        </select>
      </Section>

      {/* Género */}
      <Section title="Género">
        <Checkbox label="Macho" value="male" group="gender" />
        <Checkbox label="Hembra" value="female" group="gender" />
      </Section>

      {/* Edad */}
      <Section title="Edad">
        <Checkbox label="Cachorro (0-1 año)" value="cachorro" group="ageRange" />
        <Checkbox label="Joven (1-3 años)" value="joven" group="ageRange" />
        <Checkbox label="Adulto (3-8 años)" value="adulto" group="ageRange" />
        <Checkbox label="Senior (8 años o más)" value="senior" group="ageRange" />
      </Section>

      {/* Tamaño */}
      <Section title="Tamaño">
        <Checkbox label="Pequeño (5-12 kg)" value="small" group="size" />
        <Checkbox label="Mediano (12-25 kg)" value="medium" group="size" />
        <Checkbox label="Grande (25 kg o más)" value="large" group="size" />
      </Section>

      {/* Salud */}
      <Section title="Salud">
        <Checkbox label="Esterilizado" value="sterilized" group="health" />
        <Checkbox label="Vacunado" value="vaccinated" group="health" />
        <Checkbox label="Desparasitado" value="dewormed" group="health" />
        <Checkbox label="Microchip" value="microchip" group="health" />
      </Section>

      {/* Compatibilidad */}
      <Section title="Se lleva bien con">
        <Checkbox label="Niños" value="kids" group="compatibility" />
        <Checkbox label="Gatos" value="cats" group="compatibility" />
        <Checkbox label="Perros" value="dogs" group="compatibility" />
      </Section>

      {/* Características */}
      <Section title="Características">
        {['Amistoso', 'Regalón', 'Cariñoso', 'Juguetón', 'Protector', 'Curioso', 'Energético', 'Sociable', 'Tranquilo', 'Tímido'].map(trait => (
          <Checkbox key={trait} label={trait} value={trait} group="traits" />
        ))}
      </Section>
    </aside>
  )
}
