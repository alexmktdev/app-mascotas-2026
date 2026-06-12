import { redirect } from 'next/navigation'
import { getSessionUser } from '@/server/session'

export default async function AdminUsersLayout({ children }: { children: React.ReactNode }) {
  // El layout de /admin ya garantiza sesión activa + rol admin/staff.
  const session = await getSessionUser()

  if (session?.profile?.role !== 'admin') {
    redirect('/unauthorized')
  }

  return <>{children}</>
}
