/**
 * Página: Editar mascota.
 * Orquestador: coordina PetForm + PetPhotoUploader + API.
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchPetDetail } from '@/api/pets'
import { useUpdatePet } from '@/hooks/usePets'
import { useAuth } from '@/hooks/useAuth'
import { usePetPhotoManager } from '@/hooks/usePetPhotoManager'
import { PetForm } from '@/components/pets/PetForm'
import { PetPhotoUploader } from '@/components/pets/PetPhotoUploader'
import { transformPetFieldsToUpdate } from '@/lib/petTransform'
import { Skeleton } from '@/components/ui/Skeleton'
import type { PetFormFields } from '@/lib/validations'
import type { Pet } from '@/types'

function petToFormFields(pet: Pet): PetFormFields {
  return {
    name: pet.name ?? '',
    species: pet.species ?? 'dog',
    breed: pet.breed ?? '',
    age_months: pet.age_months ?? 1,
    gender: pet.gender ?? 'male',
    size: pet.size ?? undefined,
    color: pet.color ?? '',
    contact_phone: pet.contact_phone ?? '+56',
    weight_kg: pet.weight_kg ?? undefined,
    sterilized: pet.sterilized ?? false,
    vaccinated: pet.vaccinated ?? false,
    dewormed: pet.dewormed ?? false,
    microchip: pet.microchip ?? false,
    health_notes: pet.health_notes ?? '',
    personality: pet.personality ?? '',
    story: pet.story ?? '',
    special_needs: pet.special_needs ?? '',
    status: pet.status ?? 'available',
    drive_folder_id: pet.drive_folder_id ?? '',
    intake_date: pet.intake_date ?? '',
  }
}

export default function EditPet() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => fetchPetDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  })

  const updatePet = useUpdatePet()
  const { user } = useAuth()

  const photoManager = usePetPhotoManager({
    userId: user?.id ?? '',
    existingUrls: pet?.photo_urls ?? [],
  })

  const handleSubmit = async (data: PetFormFields) => {
    if (!id || !pet) return

    try {
      const photo_urls = await photoManager.uploadAll()
      const updates = transformPetFieldsToUpdate(data, user?.id ?? null, photo_urls)
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
        defaultValues={pet ? petToFormFields(pet) : buildCreateDefaults()}
        onSubmit={handleSubmit}
        isSubmitting={updatePet.isPending || photoManager.isUploading}
      />

      <PetPhotoUploader
        photoEntries={photoManager.photoEntries}
        addPhoto={photoManager.addPhoto}
        removePhoto={photoManager.removePhoto}
        isUploading={photoManager.isUploading}
      />
    </div>
  )
}

function buildCreateDefaults(): PetFormFields {
  return {
    name: '',
    species: 'dog',
    breed: '',
    age_months: 1,
    gender: 'male',
    size: undefined,
    color: '',
    contact_phone: '+56',
    weight_kg: undefined,
    sterilized: false,
    vaccinated: false,
    dewormed: false,
    microchip: false,
    health_notes: '',
    personality: '',
    story: '',
    special_needs: '',
    status: 'available',
    drive_folder_id: '',
    intake_date: '',
  }
}
