/**
 * Página: Agregar mascota.
 */

import { useNavigate } from 'react-router-dom'
import { useCreatePet } from '@/hooks/usePets'
import { useAuth } from '@/hooks/useAuth'
import { PetForm } from '@/components/pets/PetForm'
import type { PetFormData } from '@/lib/validations'
import type { PetInsert } from '@/types'

export default function AddPet() {
  const navigate = useNavigate()
  const createPet = useCreatePet()
  const { user } = useAuth()

  const handleSubmit = async (data: PetFormData) => {
    const petData: PetInsert = {
      name: data.name.trim(),
      species: data.species,
      breed: data.breed?.trim() || null,
      age_months: data.age_months,
      gender: data.gender,
      size: data.size ?? null,
      color: data.color?.trim() || null,
      contact_phone:
        data.contact_phone?.trim() && data.contact_phone.trim() !== '+56'
          ? data.contact_phone.trim()
          : null,
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
      special_needs: data.special_needs?.trim() || null,
      story: data.story?.trim() || null,
      status: data.status,
      photo_urls: data.photo_urls ?? [],
      drive_folder_id: data.drive_folder_id?.trim() || null,
      ...(data.intake_date?.trim() ? { intake_date: data.intake_date.trim() } : {}),
      created_by: user?.id ?? null,
    }

    try {
      await createPet.mutateAsync(petData)
      navigate('/admin/pets')
    } catch (error) {
      // Error y toast los gestiona useCreatePet (solo relanzamos para PetForm)
      throw error
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900">Agregar mascota</h1>
        <p className="text-sm text-surface-500">Registra una nueva mascota en el sistema</p>
      </div>

      <PetForm mode="create" userId={user?.id} onSubmit={handleSubmit} />
    </div>
  )
}
