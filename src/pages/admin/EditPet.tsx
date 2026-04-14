/**
 * Página: Editar mascota.
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchPetDetail } from '@/api/pets'
import { useUpdatePet } from '@/hooks/usePets'
import { useAuth } from '@/hooks/useAuth'
import { PetForm } from '@/components/pets/PetForm'
import { Skeleton } from '@/components/ui/Skeleton'
import type { PetFormData } from '@/lib/validations'
import type { PetUpdate } from '@/types'

export default function EditPet() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => fetchPetDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos de gracia mientras se edita
    refetchOnWindowFocus: false, // CLAVE: No refrescar al cambiar de pestaña mientras editas
  })
  const updatePet = useUpdatePet()
  const { user } = useAuth()

  const handleSubmit = async (data: PetFormData) => {
    if (!id) return

    const updates: PetUpdate = {
      name: data.name.trim(),
      species: data.species,
      breed: data.breed?.trim() || null,
      age_months: data.age_months,
      gender: data.gender,
      size: data.size ?? null,
      color: data.color?.trim() || null,
      weight_kg:
        data.weight_kg != null && typeof data.weight_kg === 'number' && !Number.isNaN(data.weight_kg)
          ? data.weight_kg
          : null,
      sterilized: data.sterilized,
      vaccinated: data.vaccinated,
      dewormed: data.dewormed,
      microchip: data.microchip,
      health_notes: data.health_notes?.trim() || null,
      personality: data.personality?.trim() || null,
      good_with_kids: data.good_with_kids ?? null,
      good_with_dogs: data.good_with_dogs ?? null,
      good_with_cats: data.good_with_cats ?? null,
      special_needs: data.special_needs?.trim() || null,
      story: data.story?.trim() || null,
      status: data.status,
      photo_urls: data.photo_urls,
      drive_folder_id: data.drive_folder_id?.trim() || null,
      ...(data.intake_date?.trim() ? { intake_date: data.intake_date.trim() } : {}),
      updated_by: user?.id ?? null,
    }

    try {
      await updatePet.mutateAsync({ id, updates })
      navigate('/admin/pets')
    } catch (error) {
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full !rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900">
          Editar: {pet?.name}
        </h1>
        <p className="text-sm text-surface-500">Modifica los datos de la mascota</p>
      </div>

      <PetForm
        mode="edit"
        defaultValues={pet}
        userId={user?.id}
        onSubmit={handleSubmit}
        isLoading={updatePet.isPending}
      />
    </div>
  )
}
