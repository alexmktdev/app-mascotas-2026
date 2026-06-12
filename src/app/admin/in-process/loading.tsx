import { Skeleton, AdminTableSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Skeleton className="h-7 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      <AdminTableSkeleton columns={7} rows={6} />
    </div>
  )
}
