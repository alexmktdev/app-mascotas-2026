/**
 * Tarjeta de mascota para la vista pública.
 * Memoizada porque se renderizan muchas en lista.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { Syringe, Scissors, ArrowRight } from 'lucide-react'
import type { PetCardData } from '@/types/firebase.types'
import { formatAge } from '@/utils'
import {
  SPECIES_LABELS,
  SPECIES_EMOJI,
  GENDER_LABELS,
  PET_SIZE_LABELS,
  PET_STATUS_LABELS,
  PET_STATUS_CARD_OVERLAY,
} from '@/constants'
import { Badge } from '@/components/ui/Badge'
import { PetSlider } from './PetSlider'

interface PetCardProps {
  pet: PetCardData
  index: number
}

function PetCardInner({ pet, index }: PetCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-surface-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-500/5 animate-fade-in">
      {/* Slider de fotos + estado */}
      <div className="relative">
        <span
          className={`absolute left-2 top-2 z-20 rounded-full border px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide backdrop-blur-sm ${PET_STATUS_CARD_OVERLAY[pet.status] ?? 'border-white/40 bg-black/65 text-white'}`}
        >
          {PET_STATUS_LABELS[pet.status] ?? pet.status}
        </span>
        <Link to={`/pets/${pet.id}`} className="block overflow-hidden cursor-pointer">
          <PetSlider
            photoUrls={pet.photo_urls}
            petName={pet.name}
            size="card"
            cardIndex={index}
          />
        </Link>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col px-3 py-2.5">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <Link to={`/pets/${pet.id}`} className="group/title">
              <h3 className="text-sm font-bold text-surface-900 group-hover:text-primary-600 transition-colors">
                {SPECIES_EMOJI[pet.species]} {pet.name}
              </h3>
            </Link>
            <p className="text-xs text-surface-500">
              {SPECIES_LABELS[pet.species]}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </p>
          </div>
          <Badge variant="info">{GENDER_LABELS[pet.gender]}</Badge>
        </div>

        {pet.story && (
          <p className="mb-2 line-clamp-2 text-[11px] italic leading-snug text-surface-600">
            "{pet.story}"
          </p>
        )}

        <div className="mb-2 flex flex-wrap items-center gap-1 text-[11px] text-surface-500">
          <span>📅 {formatAge(pet.age_months)}</span>
          {pet.size && (
            <>
              <span>·</span>
              <span>📏 {PET_SIZE_LABELS[pet.size]}</span>
            </>
          )}
        </div>

        {/* Badges de salud */}
        <div className="mb-2.5 flex flex-wrap gap-1">
          {pet.vaccinated && (
            <Badge variant="success">
              <Syringe className="h-2.5 w-2.5" /> Vacunado
            </Badge>
          )}
          {pet.sterilized && (
            <Badge variant="success">
              <Scissors className="h-2.5 w-2.5" /> Esterilizado
            </Badge>
          )}
        </div>

        {/* CTA */}
        <Link
          to={`/pets/${pet.id}`}
          className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-primary-500/20 transition-all hover:from-primary-600 hover:to-primary-700 hover:shadow-md"
        >
          Ver más detalles
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  )
}

export const PetCard = React.memo(PetCardInner)
