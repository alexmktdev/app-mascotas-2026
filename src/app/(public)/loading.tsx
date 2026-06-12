import { Skeleton, PetCardSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <Skeleton className="mx-auto mb-3 h-9 w-72 max-w-full" />
        <Skeleton className="mx-auto h-5 w-full max-w-2xl" />
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px] w-full !rounded-xl" />
        ))}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="w-full lg:w-[380px] lg:shrink-0 lg:sticky lg:top-24">
          <Skeleton className="h-[420px] w-full !rounded-2xl" />
        </div>

        <div className="flex-1">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <PetCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
