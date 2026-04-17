/**
 * Formulario público de adopción.
 * No requiere autenticación.
 * Incluye honeypot + timestamp anti-spam.
 */

import { useState, useRef, useLayoutEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adoptionPublicFormSchema, type AdoptionPublicFormData } from '@/lib/validations'
import { usePetDetail } from '@/hooks/usePets'
import { useCreateAdoptionRequest } from '@/hooks/useAdoptions'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { HOUSING_TYPE_LABELS, SUBMIT_COOLDOWN_MS, MIN_FORM_FILL_TIME_MS } from '@/constants'
import { CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react'
import type { FormStatus } from '@/types/firebase.types'
import type { AdoptionRequestInsert } from '@/types/firebase.types'
import toast from 'react-hot-toast'

export default function AdoptionForm() {
  const { petId } = useParams<{ petId: string }>()
  const { data: pet, isLoading: petLoading } = usePetDetail(petId, { visibility: 'public' })
  const createRequest = useCreateAdoptionRequest()
  const [formStatus, setFormStatus] = useState<FormStatus>('idle')
  const [isOnCooldown, setIsOnCooldown] = useState(false)
  const formStartTime = useRef(Date.now())

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [petId])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdoptionPublicFormData>({
    resolver: zodResolver(adoptionPublicFormSchema),
    defaultValues: {
      _honeypot: '',
    },
    shouldFocusError: true,
  })

  const onSubmit = async (data: AdoptionPublicFormData) => {
    if (!petId) {
      toast.error('ID de mascota no encontrado. Usa el botón "Adoptar" desde la ficha de la mascota.')
      return
    }

    if (data._honeypot) {
      toast.error('No se pudo enviar la solicitud.')
      return
    }

    if (Date.now() - formStartTime.current < MIN_FORM_FILL_TIME_MS) {
      toast.error(
        `Espera al menos ${Math.ceil(MIN_FORM_FILL_TIME_MS / 1000)} segundos antes de enviar (protección anti-spam).`,
      )
      return
    }

    setFormStatus('submitting')
    setIsOnCooldown(true)

    try {
      const { _honeypot, ...rest } = data
      const payload: AdoptionRequestInsert = {
        pet_id: petId,
        full_name: rest.full_name.trim(),
        email: rest.email.trim(),
        phone: rest.phone.trim(),
        id_number: rest.id_number.trim(),
        address: rest.address.trim(),
        city: rest.city.trim(),
        housing_type: rest.housing_type ?? null,
        has_yard: rest.has_yard ?? null,
        has_other_pets: rest.has_other_pets ?? null,
        other_pets_description: rest.other_pets_description?.trim() || null,
        has_children: rest.has_children ?? null,
        children_ages: rest.children_ages?.trim() || null,
        motivation: rest.motivation.trim(),
        experience_with_pets: rest.experience_with_pets?.trim() || null,
        work_schedule: rest.work_schedule?.trim() || null,
      }
      await createRequest.mutateAsync(payload)
      setFormStatus('success')
    } catch {
      setFormStatus('error')
    }

    setTimeout(() => setIsOnCooldown(false), SUBMIT_COOLDOWN_MS)
  }

  const inputClasses = 'w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'
  const labelClasses = 'mb-1 block text-sm font-medium text-surface-700'
  const errorClasses = 'mt-1 text-xs text-rose-500'

  if (formStatus === 'success') {
    return (
      <div className="mx-auto max-w-lg py-16 text-center animate-scale-in">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="mb-3 text-3xl font-extrabold text-surface-900">
          ¡Solicitud enviada! 🎉
        </h1>
        <p className="mb-2 text-lg text-surface-600">
          Hemos recibido tu solicitud de adopción para <strong>{pet?.name}</strong>.
        </p>
        <p className="mb-8 text-surface-500">
          Nuestro equipo revisará tu información y te contactará pronto al correo que proporcionaste.
        </p>
        <Link to="/">
          <Button size="lg">🐾 Ver más mascotas</Button>
        </Link>
      </div>
    )
  }

  if (petLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-64 w-full !rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <nav className="mb-6 flex items-center gap-2 text-sm text-surface-500">
        <Link to="/" className="hover:text-primary-600 transition-colors">Inicio</Link>
        <ChevronRight className="h-4 w-4" />
        {pet && (
          <>
            <Link to={`/pets/${pet.id}`} className="hover:text-primary-600 transition-colors">{pet.name}</Link>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="font-medium text-surface-800">Solicitud de adopción</span>
      </nav>

      <h1 className="mb-2 text-3xl font-extrabold text-surface-900">
        Solicitud de adopción
      </h1>
      {pet && (
        <p className="mb-8 text-lg text-surface-500">
          Estás solicitando adoptar a <strong className="text-primary-600">{pet.name}</strong> 🐾
        </p>
      )}

      {formStatus === 'error' && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <div>
            <p className="font-semibold text-rose-700">Error al enviar la solicitud</p>
            <p className="text-sm text-rose-600">Por favor, intenta nuevamente.</p>
          </div>
        </div>
      )}

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit, () => {
          toast.error('Revisa los campos con error (texto en rojo) y vuelve a enviar.')
        })}
        className="relative space-y-6"
      >
        <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
          <label htmlFor="adopt-hp">Company</label>
          <input id="adopt-hp" {...register('_honeypot')} tabIndex={-1} autoComplete="off" />
        </div>

        <fieldset className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-sm font-bold text-surface-800">Datos personales</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Nombre completo *</label>
              <input {...register('full_name')} className={inputClasses} placeholder="Juan Pérez" />
              {errors.full_name && <p className={errorClasses}>{errors.full_name.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>Correo electrónico *</label>
              <input type="email" {...register('email')} className={inputClasses} placeholder="correo@ejemplo.com" />
              {errors.email && <p className={errorClasses}>{errors.email.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>Teléfono *</label>
              <input {...register('phone')} className={inputClasses} placeholder="+56 9 1234 5678" />
              {errors.phone && <p className={errorClasses}>{errors.phone.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>RUT / Identificación *</label>
              <input {...register('id_number')} className={inputClasses} placeholder="12.345.678-9" />
              {errors.id_number && <p className={errorClasses}>{errors.id_number.message}</p>}
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-sm font-bold text-surface-800">Dirección</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClasses}>Dirección *</label>
              <input {...register('address')} className={inputClasses} placeholder="Av. Principal 123" />
              {errors.address && <p className={errorClasses}>{errors.address.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>Ciudad *</label>
              <input {...register('city')} className={inputClasses} placeholder="Santiago" />
              {errors.city && <p className={errorClasses}>{errors.city.message}</p>}
            </div>
            <div>
              <label className={labelClasses}>Tipo de vivienda</label>
              <select {...register('housing_type')} className={inputClasses}>
                <option value="">Seleccionar...</option>
                {Object.entries(HOUSING_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              {errors.housing_type && <p className={errorClasses}>{errors.housing_type.message}</p>}
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('has_yard')} className="h-4 w-4 rounded border-surface-300 text-primary-600" />
            <span className="text-sm text-surface-700">¿Tiene patio?</span>
          </label>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-sm font-bold text-surface-800">Hogar</legend>

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('has_other_pets')} className="h-4 w-4 rounded border-surface-300 text-primary-600" />
            <span className="text-sm text-surface-700">¿Tiene otras mascotas?</span>
          </label>
          <div>
            <label className={labelClasses}>Si tiene, descríbelas</label>
            <input {...register('other_pets_description')} className={inputClasses} placeholder="Ej: Un gato de 3 años" />
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('has_children')} className="h-4 w-4 rounded border-surface-300 text-primary-600" />
            <span className="text-sm text-surface-700">¿Tiene niños?</span>
          </label>
          <div>
            <label className={labelClasses}>Edades de los niños</label>
            <input {...register('children_ages')} className={inputClasses} placeholder="Ej: 5 y 8 años" />
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-sm font-bold text-surface-800">Motivación</legend>

          <div>
            <label className={labelClasses}>¿Por qué quieres adoptar? *</label>
            <textarea {...register('motivation')} rows={4} className={inputClasses} placeholder="Cuéntanos tu motivación..." />
            {errors.motivation && <p className={errorClasses}>{errors.motivation.message}</p>}
          </div>
          <div>
            <label className={labelClasses}>Experiencia con mascotas</label>
            <textarea {...register('experience_with_pets')} rows={2} className={inputClasses} placeholder="¿Has tenido mascotas antes?" />
          </div>
          <div>
            <label className={labelClasses}>Horario laboral</label>
            <input {...register('work_schedule')} className={inputClasses} placeholder="Ej: Lunes a viernes, 9:00 a 18:00" />
          </div>
        </fieldset>

        <Button
          type="submit"
          size="lg"
          className="w-full text-base"
          isLoading={formStatus === 'submitting'}
          disabled={isOnCooldown}
        >
          📨 Enviar solicitud de adopción
        </Button>
      </form>
    </div>
  )
}