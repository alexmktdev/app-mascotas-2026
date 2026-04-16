/**
 * Página: Agregar mascota.
 * Flujo: 1) Crear mascota sin fotos → 2) Subir fotos → 3) Ir a lista.
 */

import { useNavigate } from 'react-router-dom'
import { useCreatePet } from '@/hooks/usePets'
import { useAuth } from '@/hooks/useAuth'
import { usePetPhotoManager } from '@/hooks/usePetPhotoManager'
import { PetForm } from '@/components/pets/PetForm'
import { PetPhotoUploader } from '@/components/pets/PetPhotoUploader'
import { buildCreateDefaults } from '@/lib/petTransform'
import type { PetFormFields } from '@/lib/validations'
import toast from 'react-hot-toast'

export default function AddPet() {
  const navigate = useNavigate()
  const createPet = useCreatePet()
  const { user } = useAuth()

  const photoManager = usePetPhotoManager({
    petId: '',
    existingUrls: [],
  })

  const handleSubmit = async (data: PetFormFields) => {
    try {
      // 1. Crear la mascota (sin fotos)
      const result = await createPet.mutateAsync({
        name: data.name,
        species: data.species,
        breed: data.breed ?? null,
        age_months: data.age_months,
        gender: data.gender,
        size: data.size ?? null,
        color: data.color ?? null,
        contact_phone: data.contact_phone ?? null,
        weight_kg: data.weight_kg ?? null,
        sterilized: data.sterilized ?? false,
        vaccinated: data.vaccinated ?? false,
        dewormed: data.dewormed ?? false,
        microchip: data.microchip ?? false,
        health_notes: data.health_notes ?? null,
        personality: data.personality ?? null,
        story: data.story ?? null,
        special_needs: data.special_needs ?? null,
      })

      const newPetId = (result as { id: string }).id

      // 2. Subir fotos si hay nuevas (después de tener el petId real)
      if (photoManager.photoEntries.some((e) => e.kind === 'new')) {
        if (!user?.uid) {
          toast.error('Debes iniciar sesión para subir fotos')
          navigate('/admin/pets')
          return
        }
        // Esperar a que terminen las fotos antes de navegar
        await photoManager.uploadAll(newPetId)
      }

      navigate('/admin/pets')
    } catch (error) {
      throw error
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900">Agregar mascota</h1>
        <p className="text-sm text-surface-500">Registra una nueva mascota en el sistema</p>
      </div>

      <PetForm
        mode="create"
        defaultValues={buildCreateDefaults()}
        onSubmit={handleSubmit}
        isSubmitting={createPet.isPending || photoManager.isUploading}
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