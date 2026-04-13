/**
 * Dashboard del panel admin.
 * 3 cards de estadísticas + últimas solicitudes.
 */

import { usePetStats } from '@/hooks/usePets'
import { useRecentAdoptionRequests } from '@/hooks/useAdoptions'
import { ADOPTION_STATUS_LABELS, ADOPTION_STATUS_COLORS } from '@/constants'
import { formatRelativeDate } from '@/utils'
import { PawPrint, Hourglass, Heart, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { stats, isLoading: statsLoading } = usePetStats()
  const { data: recentRequests, isLoading: requestsLoading } = useRecentAdoptionRequests()

  const statCards = [
    { label: 'Disponibles', value: stats.available, icon: PawPrint, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'En proceso', value: stats.inProcess, icon: Hourglass, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Adoptadas', value: stats.adopted, icon: Heart, color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-600' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-primary-600">Sistema de Gestión de Adopción de Mascotas</h1>
        <p className="text-sm text-surface-500">Resumen general del sistema de adopciones</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="overflow-hidden rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-500">{card.label}</p>
                <p className={`mt-1 text-3xl font-extrabold text-surface-900 ${statsLoading ? 'opacity-70' : ''}`}>
                  {card.value}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.text}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Solicitudes recientes */}
      <div className="rounded-2xl border border-surface-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-surface-400" />
            <h2 className="text-lg font-bold text-surface-800">Solicitudes recientes</h2>
          </div>
          <Link to="/admin/in-process" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
            Ver todas →
          </Link>
        </div>

        {requestsLoading && !recentRequests ? (
          <div className="p-8 text-center text-sm text-surface-400">
            Cargando solicitudes recientes...
          </div>
        ) : !recentRequests || recentRequests.length === 0 ? (
          <div className="p-8 text-center text-sm text-surface-400">
            No hay solicitudes recientes
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50/50">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Solicitante</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Correo</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {recentRequests.map((req) => (
                  <tr key={req.id} className="transition-colors hover:bg-surface-50/80">
                    <td className="px-6 py-3 font-medium text-surface-800">{req.full_name}</td>
                    <td className="px-6 py-3 text-surface-600">{req.email}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ADOPTION_STATUS_COLORS[req.status]}`}>
                        {ADOPTION_STATUS_LABELS[req.status]}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-surface-500">{formatRelativeDate(req.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
