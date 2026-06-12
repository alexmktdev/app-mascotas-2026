import { fetchAdminPets } from '@/server/pets'
import { AdminPetsTable } from '@/components/next/AdminPetsTable'

export default async function AdminAdoptedPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const page = Number(params.page ?? '1') || 1

  const result = await fetchAdminPets({ status: 'adopted', page })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900">🎉 Mascotas adoptadas</h1>
        <p className="text-sm text-surface-500">Registro de mascotas que encontraron un hogar</p>
      </div>

      <AdminPetsTable
        result={result}
        emptyTitle="Sin adoptados aún"
        emptyDescription="Cuando se aprueben solicitudes, las mascotas adoptadas aparecerán aquí."
      />
    </div>
  )
}
