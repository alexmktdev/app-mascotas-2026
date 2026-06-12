import { fetchAdoptionRequests } from '@/server/adoptions'
import { AdminAdoptionsTable } from '@/components/next/AdminAdoptionsTable'

export default async function AdminInProcessPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = Number(params.page ?? '1') || 1

  const result = await fetchAdoptionRequests({ page, status: ['pending', 'reviewing'] })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900">Solicitudes de adopción</h1>
        <p className="text-sm text-surface-500">Revisa y gestiona las solicitudes recibidas</p>
      </div>

      <AdminAdoptionsTable result={result} />
    </div>
  )
}
