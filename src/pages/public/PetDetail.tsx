/**
 * Detalle de mascota — Muestra TODOS los campos.
 */

import { useParams, Link } from 'react-router-dom'
import { usePetDetail } from '@/hooks/usePets'
import { PetSlider } from '@/components/pets/PetSlider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatAge, formatDate } from '@/utils'
import {
  SPECIES_LABELS, SPECIES_EMOJI, GENDER_LABELS, PET_SIZE_LABELS,
  PET_STATUS_LABELS, PET_STATUS_COLORS,
} from '@/constants'
import {
  ChevronRight, Heart, Syringe, Scissors, Bug, Cpu,
  Baby, Dog, Cat, AlertCircle, Calendar, Scale, BookOpen,
} from 'lucide-react'

export default function PetDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: pet, isLoading, error } = usePetDetail(id)

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-80 w-full !rounded-2xl" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
    )
  }

  if (error || !pet) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <AlertCircle className="mb-4 h-16 w-16 text-surface-300" />
        <h2 className="mb-2 text-2xl font-bold text-surface-800">Mascota no encontrada</h2>
        <p className="mb-6 text-surface-500">Esta mascota no existe o ya no está disponible.</p>
        <Link to="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-surface-500">
        <Link to="/" className="hover:text-primary-600 transition-colors">Inicio</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-surface-800">{pet.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Fotos */}
        <div className="w-full min-h-0 overflow-hidden rounded-2xl border border-surface-200 shadow-sm">
          <PetSlider photoUrls={pet.photo_urls} petName={pet.name} size="detail" cardIndex={0} />
        </div>

        {/* Info principal */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-surface-900">
                {SPECIES_EMOJI[pet.species]} {pet.name}
              </h1>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${PET_STATUS_COLORS[pet.status]}`}>
                {PET_STATUS_LABELS[pet.status]}
              </span>
            </div>
            <p className="text-lg text-surface-600">
              {SPECIES_LABELS[pet.species]}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </p>
          </div>

          {/* Datos rápidos */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard icon={<Calendar className="h-5 w-5" />} label="Edad" value={formatAge(pet.age_months)} />
            <InfoCard icon={<Heart className="h-5 w-5" />} label="Género" value={GENDER_LABELS[pet.gender] ?? pet.gender} />
            {pet.size && <InfoCard icon={<Scale className="h-5 w-5" />} label="Tamaño" value={PET_SIZE_LABELS[pet.size] ?? pet.size} />}
            {pet.weight_kg && <InfoCard icon={<Scale className="h-5 w-5" />} label="Peso" value={`${pet.weight_kg} kg`} />}
            {pet.color && <InfoCard icon={<Dog className="h-5 w-5" />} label="Color" value={pet.color} />}
            <InfoCard icon={<Calendar className="h-5 w-5" />} label="Ingreso" value={formatDate(pet.intake_date)} />
          </div>

          {/* Badges de salud */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-surface-800">Estado de salud</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant={pet.vaccinated ? 'success' : 'default'}>
                <Syringe className="h-3 w-3" /> {pet.vaccinated ? 'Vacunado' : 'Sin vacunar'}
              </Badge>
              <Badge variant={pet.sterilized ? 'success' : 'default'}>
                <Scissors className="h-3 w-3" /> {pet.sterilized ? 'Esterilizado' : 'No esterilizado'}
              </Badge>
              <Badge variant={pet.dewormed ? 'success' : 'default'}>
                <Bug className="h-3 w-3" /> {pet.dewormed ? 'Desparasitado' : 'Sin desparasitar'}
              </Badge>
              <Badge variant={pet.microchip ? 'success' : 'default'}>
                <Cpu className="h-3 w-3" /> {pet.microchip ? 'Con microchip' : 'Sin microchip'}
              </Badge>
            </div>
          </div>

          {/* Compatibilidad */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-surface-800">Compatibilidad</h3>
            <div className="flex flex-wrap gap-2">
              {pet.good_with_kids !== null && (
                <Badge variant={pet.good_with_kids ? 'success' : 'warning'}>
                  <Baby className="h-3 w-3" /> {pet.good_with_kids ? 'Bueno con niños' : 'No ideal con niños'}
                </Badge>
              )}
              {pet.good_with_dogs !== null && (
                <Badge variant={pet.good_with_dogs ? 'success' : 'warning'}>
                  <Dog className="h-3 w-3" /> {pet.good_with_dogs ? 'Bueno con perros' : 'No ideal con perros'}
                </Badge>
              )}
              {pet.good_with_cats !== null && (
                <Badge variant={pet.good_with_cats ? 'success' : 'warning'}>
                  <Cat className="h-3 w-3" /> {pet.good_with_cats ? 'Bueno con gatos' : 'No ideal con gatos'}
                </Badge>
              )}
            </div>
          </div>

          {/* Historia */}
          {pet.story && (
            <div className="rounded-2xl border border-primary-100 bg-primary-50/30 p-6 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-primary-900">
                <BookOpen className="h-5 w-5" /> Nuestra Historia
              </h3>
              <p className="whitespace-pre-wrap text-base italic leading-relaxed text-surface-700">
                "{pet.story}"
              </p>
            </div>
          )}

          {/* Personalidad */}
          {pet.personality && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-surface-800">Personalidad</h3>
              <p className="text-sm text-surface-600">{pet.personality}</p>
            </div>
          )}

          {/* Notas de salud */}
          {pet.health_notes && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-surface-800">Notas de salud</h3>
              <p className="text-sm text-surface-600">{pet.health_notes}</p>
            </div>
          )}

          {/* Necesidades especiales */}
          {pet.special_needs && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="mb-1 text-sm font-semibold text-amber-800">⚠️ Necesidades especiales</h3>
              <p className="text-sm text-amber-700">{pet.special_needs}</p>
            </div>
          )}

          {/* CTA Adopción */}
          {pet.status === 'available' && (
            <Link to={`/adopt/${pet.id}`}>
              <Button size="lg" className="w-full text-base">
                🏠 Adoptar a {pet.name}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-surface-200 bg-white p-3 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        {icon}
      </div>
      <div>
        <p className="text-xs text-surface-500">{label}</p>
        <p className="text-sm font-semibold text-surface-800">{value}</p>
      </div>
    </div>
  )
}
