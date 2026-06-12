import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="animate-fade-in space-y-6">
      <Skeleton className="mb-6 h-5 w-40" />
      <Skeleton className="h-9 w-1/2" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full !rounded-xl" />
        ))}
      </div>
    </div>
  )
}
