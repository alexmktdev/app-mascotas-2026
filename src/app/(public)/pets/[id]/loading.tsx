import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <Skeleton className="mb-6 h-5 w-40" />

      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full !rounded-2xl" />

        <div className="space-y-6">
          <div>
            <Skeleton className="mb-2 h-9 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full !rounded-xl" />
            ))}
          </div>

          <Skeleton className="h-24 w-full !rounded-xl" />
          <Skeleton className="h-12 w-full !rounded-xl" />
        </div>
      </div>
    </div>
  )
}
