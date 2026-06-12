import { CreateUserForm } from '@/components/next/CreateUserForm'

export default function CreateUserPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900">Crear usuario</h1>
        <p className="text-sm text-surface-500">Registra un nuevo usuario del sistema</p>
      </div>

      <CreateUserForm />
    </div>
  )
}
