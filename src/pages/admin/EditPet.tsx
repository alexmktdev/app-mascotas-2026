/**
 * Página: Editar mascota.
 * Lectura → Firestore directo.
 * Escritura → Cloud Functions (solo admins).
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchPetDetail } from '@/api/pets-firebase'
import { useUpdatePet } from '@/hooks/usePets'
import { usePetPhotoManager } from '@/hooks/usePetPhotoManager'
import { PetForm } from '@/components/pets/PetForm'
import { PetPhotoUploader } from '@/components/pets/PetPhotoUploader'
import { Skeleton } from '@/components/ui/Skeleton'
import type { PetFormFields } from '@/lib/validations'
import type { Pet } from '@/types/firebase.types'
import { useAuth } from '@/hooks/useAuth'

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
  const { user } = useAuth()

  const { data: pet, isLoading } = useQuery({
    queryKey: ['pet', id],
    queryFn: () => fetchPetDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  })

  const updatePet = useUpdatePet()

  const photoManager = usePetPhotoManager({
    petId: id ?? '__unknown__',
    existingUrls: pet?.photo_urls ?? [],
  })

  const handleSubmit = async (data: PetFormFields) => {
    if (!id) return

    try {
      // Subir fotos nuevas antes de actualizar (si hay nuevas)
      let updatedPhotoUrls: string[] | undefined
      if (photoManager.photoEntries.some((e) => e.kind === 'new')) {
        updatedPhotoUrls = await photoManager.uploadAll()
      }

      const updates: Record<string, unknown> = {
        name: data.name,
        species: data.species,
        breed: data.breed ?? null,
        age_months: data.age_months,
        gender: data.gender,
        size: data.size ?? null,
        color: data.color ?? null,
        contact_phone: data.contact_phone ?? null,
        weight_kg: data.weight_kg ?? null,
        sterilized: data.sterilized,
        vaccinated: data.vaccinated,
        dewormed: data.dewormed,
        microchip: data.microchip,
        health_notes: data.health_notes ?? null,
        personality: data.personality ?? null,
        story: data.story ?? null,
        good_with_kids: pet?.good_with_kids ?? null,
        good_with_dogs: pet?.good_with_dogs ?? null,
        good_with_cats: pet?.good_with_cats ?? null,
        special_needs: data.special_needs ?? null,
        status: data.status,
        intake_date: data.intake_date,
        drive_folder_id: data.drive_folder_id ?? null,
        updated_by: user?.uid ?? null,
      }

      if (updatedPhotoUrls !== undefined) {
        // Lista completa (existentes + nuevas); uploadPetPhoto ya guardó en Firestore, aquí alineamos el update con el mismo orden
        updates.photo_urls = updatedPhotoUrls
      }

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
        defaultValues={pet ? petToFormFields(pet) : {
          name: '', species: 'dog', breed: '', age_months: 1, gender: 'male',
          size: undefined, color: '', contact_phone: '+56', weight_kg: undefined,
          sterilized: false, vaccinated: false, dewormed: false, microchip: false,
          health_notes: '', personality: '', story: '', special_needs: '',
          status: 'available', drive_folder_id: '', intake_date: '',
        }}
        onSubmit={handleSubmit}
        isSubmitting={updatePet.isPending || photoManager.isUploading}
        beforeSubmit={
          <PetPhotoUploader
            photoEntries={photoManager.photoEntries}
            addPhoto={photoManager.addPhoto}
            removePhoto={photoManager.removePhoto}
            isUploading={photoManager.isUploading}
          />
        }
      />
    </div>
  )
}