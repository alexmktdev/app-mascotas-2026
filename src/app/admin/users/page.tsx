import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { getSessionUser } from '@/server/session'
import { fetchUsers } from '@/server/users'
import { AdminUsersTable } from '@/components/next/AdminUsersTable'

export default async function AdminUsersPage() {
  const [session, users] = await Promise.all([getSessionUser(), fetchUsers()])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900">Usuarios</h1>
          <p className="text-sm text-surface-500">Gestiona los usuarios del sistema</p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-600/20 transition-colors hover:bg-primary-700"
        >
          <UserPlus className="h-4 w-4" />
          Crear usuario
        </Link>
      </div>

      <AdminUsersTable users={users} currentUid={session?.uid ?? ''} />
    </div>
  )
}
