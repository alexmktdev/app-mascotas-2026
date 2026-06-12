'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { PetForm } from '@/components/pets/PetForm'
import { PetPhotoUploader } from '@/components/next/PetPhotoUploader'
import { usePetPhotoManagerNext } from '@/hooks/usePetPhotoManagerNext'
import { createPetAction, updatePetAction } from '@/server/pets-actions'
import type { PetFormFields } from '@/lib/validations'
import type { Pet } from '@/types/firebase.types'

interface AdminPetFormProps {
  mode: 'create' | 'edit'
  petId?: string
  defaultValues: PetFormFields
  pet?: Pet
}

function formDataFromFields(data: PetFormFields, pet?: Pet): FormData {
  const formData = new FormData()
  formData.set('name', data.name)
  formData.set('species', data.species)
  formData.set('breed', data.breed ?? '')
  formData.set('age_months', String(data.age_months))
  formData.set('gender', data.gender)
  formData.set('size', data.size ?? '')
  formData.set('color', data.color ?? '')
  formData.set('contact_phone', data.contact_phone ?? '')
  formData.set('weight_kg', data.weight_kg != null && !Number.isNaN(data.weight_kg) ? String(data.weight_kg) : '')
  formData.set('sterilized', String(data.sterilized ?? false))
  formData.set('vaccinated', String(data.vaccinated ?? false))
  formData.set('dewormed', String(data.dewormed ?? false))
  formData.set('microchip', String(data.microchip ?? false))
  formData.set('health_notes', data.health_notes ?? '')
  formData.set('personality', data.personality ?? '')
  formData.set('story', data.story ?? '')
  formData.set('special_needs', data.special_needs ?? '')
  formData.set('status', data.status ?? 'available')
  formData.set('drive_folder_id', data.drive_folder_id ?? '')
  formData.set('intake_date', data.intake_date ?? '')

  if (pet) {
    formData.set('good_with_kids', pet.good_with_kids == null ? '' : String(pet.good_with_kids))
    formData.set('good_with_dogs', pet.good_with_dogs == null ? '' : String(pet.good_with_dogs))
    formData.set('good_with_cats', pet.good_with_cats == null ? '' : String(pet.good_with_cats))
    formData.set('expected_updated_at', pet.updated_at ?? '')
  }

  return formData
}

export function AdminPetForm({ mode, petId, defaultValues, pet }: AdminPetFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const photoManager = usePetPhotoManagerNext({
    petId: petId ?? '',
    existingUrls: pet?.photo_urls ?? [],
  })

  const handleSubmit = async (data: PetFormFields) => {
    setIsSubmitting(true)
    try {
      if (mode === 'create') {
        const formData = formDataFromFields(data)
        const result = await createPetAction(formData)
        if (!result.success) {
          toast.error(result.error)
          return
        }

        if (photoManager.photoEntries.some((e) => e.kind === 'new')) {
          await photoManager.uploadAll(result.id)
        }

        router.push('/admin/pets')
        router.refresh()
        return
      }

      if (!petId) return

      if (photoManager.photoEntries.some((e) => e.kind === 'new')) {
        await photoManager.uploadAll()
      }

      const formData = formDataFromFields(data, pet)
      const result = await updatePetAction(petId, formData)
      if (!result.success) {
        toast.error(result.error)
        return
      }

      router.push('/admin/pets')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PetForm
      mode={mode}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting || photoManager.isUploading}
      beforeSubmit={
        <PetPhotoUploader
          photoEntries={photoManager.photoEntries}
          addPhoto={photoManager.addPhoto}
          removePhoto={photoManager.removePhoto}
          isUploading={photoManager.isUploading}
        />
      }
    />
  )
}
