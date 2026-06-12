import { AdminPetForm } from '@/components/next/AdminPetForm'
import { buildCreateDefaults } from '@/lib/petTransform'

export default function AddPetPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900">Agregar mascota</h1>
        <p className="text-sm text-surface-500">Registra una nueva mascota en el sistema</p>
      </div>

      <AdminPetForm mode="create" defaultValues={buildCreateDefaults()} />
    </div>
  )
}
