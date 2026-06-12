import Link from 'next/link'
import { AlertCircle, ChevronRight } from 'lucide-react'
import { fetchPetDetail } from '@/server/pets'
import { AdoptionRequestForm } from '@/components/next/AdoptionRequestForm'
import { Button } from '@/components/ui/Button'

export default async function AdoptionFormPage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = await params
  const pet = await fetchPetDetail(petId, { visibility: 'public' })

  if (!pet || pet.status !== 'available') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <AlertCircle className="mb-4 h-16 w-16 text-surface-300" />
        <h2 className="mb-2 text-2xl font-bold text-surface-800">Mascota no disponible</h2>
        <p className="mb-6 text-surface-500">Esta mascota no existe o ya no está disponible para adopción.</p>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <nav className="mb-6 flex items-center gap-2 text-sm text-surface-500">
        <Link href="/" className="hover:text-primary-600 transition-colors">Inicio</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/pets/${pet.id}`} className="hover:text-primary-600 transition-colors">{pet.name}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-surface-800">Solicitud de adopción</span>
      </nav>

      <h1 className="mb-2 text-3xl font-extrabold text-surface-900">
        Solicitud de adopción
      </h1>
      <p className="mb-8 text-lg text-surface-500">
        Estás solicitando adoptar a <strong className="text-primary-600">{pet.name}</strong> 🐾
      </p>

      <AdoptionRequestForm petId={pet.id} petName={pet.name} />
    </div>
  )
}
