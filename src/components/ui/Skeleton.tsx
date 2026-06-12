/**
 * Componente Skeleton reutilizable para estados de carga.
 */

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />
}

/** Skeleton de una tarjeta de mascota */
export function PetCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
      <Skeleton className="h-56 w-full !rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 !rounded-full" />
          <Skeleton className="h-6 w-16 !rounded-full" />
        </div>
        <Skeleton className="h-10 w-full !rounded-xl" />
      </div>
    </div>
  )
}

/** Skeleton de filas de tabla */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-surface-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

/** Skeleton para tarjeta de estadísticas */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}
