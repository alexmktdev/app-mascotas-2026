/**
 * Página de acceso no autorizado.
 */

import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ShieldX } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center animate-fade-in">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
        <ShieldX className="h-10 w-10 text-rose-500" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-surface-900">Acceso no autorizado</h1>
      <p className="mb-8 max-w-md text-surface-500">
        No tienes permisos para acceder a esta sección. Contacta al administrador si crees que es un error.
      </p>
      <Link to="/">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  )
}
