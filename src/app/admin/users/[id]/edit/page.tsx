import { notFound } from 'next/navigation'
import { fetchUserById } from '@/server/users'
import { EditUserForm } from '@/components/next/EditUserForm'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await fetchUserById(id)

  if (!user) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900">Editar usuario</h1>
        <p className="text-sm text-surface-500">
          {user.first_name} {user.last_name} — {user.email}
        </p>
      </div>

      <EditUserForm user={user} />
    </div>
  )
}
