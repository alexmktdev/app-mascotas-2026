import { Loader2 } from 'lucide-react'

/** Indicador de carga centrado para usar en loading.tsx de rutas. */
export function PageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
    </div>
  )
}
