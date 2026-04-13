/**
 * DataTable genérica reutilizable para todas las tablas del admin.
 */

import React from 'react'
import { TableRowSkeleton } from './Skeleton'
import { EmptyState } from './EmptyState'
import { Pagination } from './Pagination'
import { AlertCircle, Inbox } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  /** Si es false, en carga inicial muestra estado vacío en lugar de skeleton. */
  showLoadingSkeleton?: boolean
  /** Si la query falló (red, timeout, RLS): evita confundir con “lista vacía” o skeleton eterno. */
  isError?: boolean
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  /** Tablas destacadas: borde, sombra y encabezado con más presencia (solo algunas páginas admin). */
  variant?: 'default' | 'featured'
  pagination?: {
    currentPage: number
    pageCount: number
    total: number
    onPageChange: (page: number) => void
  }
}

function DataTableInner<T extends { id: string }>({
  columns,
  data,
  isLoading = false,
  showLoadingSkeleton = true,
  isError = false,
  onRetry,
  emptyTitle = 'Sin resultados',
  emptyDescription = 'No se encontraron registros.',
  variant = 'default',
  pagination,
}: DataTableProps<T>) {
  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-8 w-8 text-rose-500" />}
        title="No se pudieron cargar los datos"
        description="Revisa tu conexión o que el proyecto Supabase esté activo. Si sigue igual, recarga la página."
        actionLabel={onRetry ? 'Reintentar' : undefined}
        onAction={onRetry}
      />
    )
  }

  if (isLoading && data.length === 0 && !showLoadingSkeleton) {
    return (
      <div className="rounded-xl border border-surface-200 bg-white px-6 py-10 text-center text-sm text-surface-500">
        Cargando datos...
      </div>
    )
  }

  if (data.length === 0 && (!isLoading || !showLoadingSkeleton)) {
    return (
      <EmptyState
        icon={<Inbox className="h-8 w-8" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  const wrap =
    variant === 'featured'
      ? 'overflow-x-auto rounded-2xl border-2 border-primary-200/70 bg-white shadow-lg shadow-primary-900/[0.06] ring-1 ring-surface-100'
      : 'overflow-x-auto rounded-xl border border-surface-200'

  const headRow =
    variant === 'featured'
      ? 'border-b-2 border-primary-200/80 bg-gradient-to-r from-primary-100/90 via-white to-violet-100/70'
      : 'border-b border-surface-200 bg-surface-50'

  const thBase =
    variant === 'featured'
      ? 'px-5 py-4 text-xs font-extrabold uppercase tracking-wide text-primary-900/85'
      : 'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500'

  const tdBase =
    variant === 'featured'
      ? 'px-5 py-4 text-sm text-surface-800'
      : 'px-4 py-3 text-surface-700'

  const rowHover =
    variant === 'featured'
      ? 'transition-colors hover:bg-primary-50/50 even:bg-surface-50/40'
      : 'transition-colors hover:bg-surface-50/80'

  return (
    <div>
      <div className={wrap}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className={headRow}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${thBase} ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100/90">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={columns.length} />
                ))
              : data.map((item) => (
                  <tr
                    key={item.id}
                    className={rowHover}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`${tdBase} ${col.className ?? ''}`}
                      >
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          pageCount={pagination.pageCount}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  )
}

export const DataTable = React.memo(DataTableInner) as typeof DataTableInner
