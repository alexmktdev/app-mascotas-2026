import { Skeleton, AdminTableSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 !rounded-xl" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 !rounded-xl" />
        ))}
      </div>

      <AdminTableSkeleton columns={8} rows={6} />
    </div>
  )
}
