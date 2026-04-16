/**
 * Layout del panel de administración.
 */

import { Outlet, ScrollRestoration } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayout() {
  return (
    <>
      <ScrollRestoration />
      <div className="flex h-[100dvh] min-h-0 overflow-hidden bg-surface-50">
      <AdminSidebar />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <div className="mx-auto w-full max-w-[min(100%,92rem)] px-4 py-8 sm:px-6 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
    </>
  )
}
