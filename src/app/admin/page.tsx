import Link from 'next/link'
import { PawPrint, Hourglass, Heart } from 'lucide-react'
import { fetchAllPetStats } from '@/server/pets'
import { fetchActionableAdoptionRequestsCount } from '@/server/adoptions'

export default async function AdminDashboardPage() {
  const [stats, actionableAdoptions] = await Promise.all([
    fetchAllPetStats(),
    fetchActionableAdoptionRequestsCount(),
  ])

  const statCards = [
    { label: 'Disponibles', value: stats.available, icon: PawPrint, bg: 'bg-emerald-50', text: 'text-emerald-600', href: '/admin/pets' },
    { label: 'En proceso', value: actionableAdoptions, icon: Hourglass, bg: 'bg-amber-50', text: 'text-amber-600', href: '/admin/in-process' },
    { label: 'Adoptadas', value: stats.adopted, icon: Heart, bg: 'bg-violet-50', text: 'text-violet-600', href: '/admin/adopted' },
  ]

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-primary-600 sm:text-4xl">Sistema de Gestión de Adopción de Mascotas</h1>
        <p className="mt-2 text-base text-surface-500">Resumen general del sistema de adopciones</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="block overflow-hidden rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-500">{card.label}</p>
                <p className="mt-1 text-3xl font-extrabold text-surface-900">{card.value}</p>
                <p className="mt-2 text-xs text-primary-600">Ver listado →</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.text}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
