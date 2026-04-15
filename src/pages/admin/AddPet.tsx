/**
 * Página: Agregar mascota.
 * Orquestador: coordina PetForm + PetPhotoUploader + API.
 */

import { useNavigate } from 'react-router-dom'
import { useCreatePet } from '@/hooks/usePets'
import { useAuth } from '@/hooks/useAuth'
import { usePetPhotoManager } from '@/hooks/usePetPhotoManager'
import { PetForm } from '@/components/pets/PetForm'
import { PetPhotoUploader } from '@/components/pets/PetPhotoUploader'
import { buildCreateDefaults, transformPetFieldsToInsert } from '@/lib/petTransform'
import type { PetFormFields } from '@/lib/validations'
import toast from 'react-hot-toast'

export default function AddPet() {
  const navigate = useNavigate()
  const createPet = useCreatePet()
  const { user } = useAuth()

  const photoManager = usePetPhotoManager({ userId: user?.id ?? '' })

  const handleSubmit = async (data: PetFormFields) => {
    const hasNew = photoManager.photoEntries.some((e) => e.kind === 'new')

    if (hasNew && !user?.id) {
      toast.error('Debes iniciar sesión para subir fotos')
      return
    }

    try {
      const photo_urls = hasNew ? await photoManager.uploadAll() : []
      const petData = transformPetFieldsToInsert(data, user?.id ?? null, photo_urls)
      await createPet.mutateAsync(petData)
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
