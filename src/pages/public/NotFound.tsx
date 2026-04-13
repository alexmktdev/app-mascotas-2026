/**
 * Página 404 personalizada.
 */

import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center animate-fade-in">
      <p className="mb-2 text-7xl font-extrabold text-primary-500">404</p>
      <h1 className="mb-2 text-2xl font-bold text-surface-900">Página no encontrada</h1>
      <p className="mb-8 max-w-md text-surface-500">
        La página que buscas no existe o fue movida. Vuelve al inicio para seguir explorando.
      </p>
      <Link to="/">
        <Button size="lg">
          <Home className="h-4 w-4" />
          Volver al inicio
        </Button>
      </Link>
    </div>
  )
}
