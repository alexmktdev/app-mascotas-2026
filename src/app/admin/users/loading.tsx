import { Skeleton, AdminTableSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 !rounded-xl" />
      </div>

      <AdminTableSkeleton columns={6} rows={6} />
    </div>
  )
}
