/**
 * Header público — Municipalidad de Molina.
 */

import { PawPrint } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-primary-700/40 gradient-molina shadow-xl">
      <div className="flex h-24 w-full items-center px-0 relative overflow-hidden">
        <Link to="/" className="relative h-20 overflow-hidden ml-10 rounded-2xl shadow-md border border-white/20">
          <img
            src="/mascotas.png"
            alt="Mascotas"
            className="h-full w-auto object-contain"
          />
        </Link>
        
        {/* Huellitas decorativas en el header */}
        <div className="absolute top-4 right-20 opacity-10 rotate-12">
          <PawPrint className="h-12 w-12 text-white" />
        </div>
        <div className="absolute bottom-2 right-40 opacity-5 -rotate-12">
          <PawPrint className="h-8 w-8 text-white" />
        </div>
      </div>
    </header>
  )
}
