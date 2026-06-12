import { redirect } from 'next/navigation'
import { getSessionUser } from '@/server/session'
import { AdminSidebar } from '@/components/next/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser()

  if (!session) {
    redirect('/login')
  }

  const { profile } = session
  if (!profile || !profile.is_active || (profile.role !== 'admin' && profile.role !== 'staff')) {
    redirect('/unauthorized')
  }

  return (
    <div className="flex h-[100dvh] min-h-0 overflow-hidden bg-surface-50">
      <AdminSidebar profile={profile} />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <div className="mx-auto w-full max-w-[min(100%,92rem)] px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  )
}
