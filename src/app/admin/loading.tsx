import { Skeleton, StatCardSkeleton, AdminTableSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Skeleton className="h-7 w-96 max-w-full" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="rounded-2xl border border-surface-200 bg-white shadow-sm">
        <div className="border-b border-surface-100 px-6 py-4">
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="p-4">
          <AdminTableSkeleton columns={4} rows={5} />
        </div>
      </div>
    </div>
  )
}
