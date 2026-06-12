import Link from 'next/link'
import { PawPrint, Dog, Cat } from 'lucide-react'

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-primary-700/40 gradient-molina shadow-xl">
      <div className="flex h-24 w-full items-center px-0 relative overflow-hidden">
        <Link href="/" className="relative h-20 overflow-hidden ml-10 rounded-2xl shadow-md border border-white/20">
          <img src="/mascotas.png" alt="Mascotas" className="h-full w-auto object-contain" />
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

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-50 relative overflow-hidden">
      {/* Background decoration - Huellitas */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03]">
        <PawPrint className="absolute top-40 left-10 h-32 w-32 rotate-12" />
        <PawPrint className="absolute top-1/2 left-[15%] h-24 w-24 -rotate-12" />
        <PawPrint className="absolute bottom-20 left-5 h-40 w-40 rotate-[30deg]" />
        <PawPrint className="absolute top-20 right-10 h-36 w-36 -rotate-12" />
        <PawPrint className="absolute bottom-40 right-[10%] h-28 w-28 rotate-12" />
      </div>

      {/* Decorative Mascotas Cartoon Style */}
      <div className="fixed -bottom-4 -left-4 pointer-events-none z-20 opacity-20 lg:opacity-30">
        <Dog className="h-48 w-48 text-primary-600 animate-bounce-slow" />
      </div>
      <div className="fixed -top-10 -right-10 pointer-events-none z-20 opacity-10">
        <Cat className="h-64 w-64 text-primary-500 -rotate-45" />
      </div>

      <PublicHeader />
      <main className="relative z-10 flex-1 mx-auto w-full max-w-[1650px] px-6 py-12 lg:px-10">
        {children}
      </main>
      <footer className="gradient-molina py-12 mt-auto border-t border-primary-800/50">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-primary-200">
          <p className="font-medium text-white">
            © {new Date().getFullYear()} Municipalidad de Molina — Programa de Adopción de Mascotas
          </p>
          <p className="mt-1 text-primary-300">
            Molina, Tierra que Enamora 🐾
          </p>
        </div>
      </footer>
    </div>
  )
}
