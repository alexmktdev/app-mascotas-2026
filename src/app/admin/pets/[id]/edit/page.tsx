import { notFound } from 'next/navigation'
import { fetchPetDetail } from '@/server/pets'
import { AdminPetForm } from '@/components/next/AdminPetForm'
import type { PetFormFields } from '@/lib/validations'
import type { Pet } from '@/types/firebase.types'

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

export default async function EditPetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pet = await fetchPetDetail(id, { visibility: 'all' })

  if (!pet) {
    notFound()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900">
          Editar: {pet.name}
        </h1>
        <p className="text-sm text-surface-500">Modifica los datos de la mascota</p>
      </div>

      <AdminPetForm mode="edit" petId={pet.id} defaultValues={petToFormFields(pet)} pet={pet} />
    </div>
  )
}
