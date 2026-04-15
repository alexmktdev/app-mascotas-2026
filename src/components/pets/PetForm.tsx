/**
 * Formulario de mascota — componente presentacional puro.
 * Solo renderiza campos y maneja validación con react-hook-form + zod.
 * NO sabe nada de uploads, Storage, ni transformación de datos.
 */

import { memo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { petFormSchema, type PetFormFields } from '@/lib/validations'
import { Button } from '@/components/ui/Button'
import { SPECIES_LABELS, GENDER_LABELS, PET_SIZE_LABELS } from '@/constants'
import { AlertCircle } from 'lucide-react'

interface PetFormProps {
  mode: 'create' | 'edit'
  defaultValues: PetFormFields
  onSubmit: (data: PetFormFields) => void | Promise<void>
  isSubmitting?: boolean
}

export const PetForm = memo(function PetForm({
  mode,
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: PetFormProps) {
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PetFormFields>({
    resolver: zodResolver(petFormSchema),
    defaultValues,
  })

  const validationErrorCount = Object.keys(errors).length

  const inputClasses =
    'w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'
  const labelClasses = 'mb-1 block text-sm font-medium text-surface-700'
  const errorClasses = 'mt-1 text-xs text-rose-500'
  const checkboxClasses = 'h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500'

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => setHasAttemptedSubmit(true))}
      className="space-y-8"
    >
      {/* Información básica */}
      <fieldset className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
        <legend className="px-2 text-sm font-bold text-surface-800">Información básica</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClasses}>Nombre *</label>
            <input {...register('name')} className={inputClasses} placeholder="Ej: Luna" />
            {errors.name && <p className={errorClasses}>{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelClasses}>Especie *</label>
            <select {...register('species')} className={inputClasses}>
              {Object.entries(SPECIES_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {errors.species && <p className={errorClasses}>{errors.species.message}</p>}
          </div>

          <div>
            <label className={labelClasses}>Raza</label>
            <input {...register('breed')} className={inputClasses} placeholder="Ej: Mestizo" />
          </div>

          <div>
            <label className={labelClasses}>Edad (meses) *</label>
            <input
              type="number"
              {...register('age_months', { valueAsNumber: true })}
              className={inputClasses}
              min={0}
            />
            {errors.age_months && <p className={errorClasses}>{errors.age_months.message}</p>}
          </div>

          <div>
            <label className={labelClasses}>Género *</label>
            <select {...register('gender')} className={inputClasses}>
              {Object.entries(GENDER_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClasses}>Tamaño</label>
            <select {...register('size')} className={inputClasses}>
              <option value="">Seleccionar...</option>
              {Object.entries(PET_SIZE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {errors.size && <p className={errorClasses}>{errors.size.message || 'Selecciona un tamaño válido'}</p>}
          </div>

          <div>
            <label className={labelClasses}>Color</label>
            <input {...register('color')} className={inputClasses} placeholder="Ej: Negro y blanco" />
          </div>

          <div>
            <label className={labelClasses}>Fono de contacto</label>
            <input {...register('contact_phone')} className={inputClasses} placeholder="+56 9 1234 5678" />
            {errors.contact_phone && <p className={errorClasses}>{errors.contact_phone.message}</p>}
          </div>

          <div>
            <label className={labelClasses}>Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              {...register('weight_kg', { valueAsNumber: true })}
              className={inputClasses}
            />
          </div>
        </div>
      </fieldset>

      {/* Salud */}
      <fieldset className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
        <legend className="px-2 text-sm font-bold text-surface-800">Salud</legend>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('sterilized')} className={checkboxClasses} />
            <span className="text-sm text-surface-700">Esterilizado</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('vaccinated')} className={checkboxClasses} />
            <span className="text-sm text-surface-700">Vacunado</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('dewormed')} className={checkboxClasses} />
            <span className="text-sm text-surface-700">Desparasitado</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('microchip')} className={checkboxClasses} />
            <span className="text-sm text-surface-700">Microchip</span>
          </label>
        </div>

        <div>
          <label className={labelClasses}>Notas de salud</label>
          <textarea
            {...register('health_notes')}
            rows={3}
            maxLength={3000}
            className={inputClasses}
            placeholder="Observaciones médicas..."
          />
          {errors.health_notes && <p className={errorClasses}>{errors.health_notes.message}</p>}
        </div>
      </fieldset>

      {/* Personalidad */}
      <fieldset className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
        <legend className="px-2 text-sm font-bold text-surface-800">Personalidad</legend>

        <div>
          <label className={labelClasses}>Personalidad</label>
          <textarea
            {...register('personality')}
            rows={2}
            maxLength={2000}
            className={inputClasses}
            placeholder="Ej: Juguetón, cariñoso, tranquilo..."
          />
          {errors.personality && <p className={errorClasses}>{errors.personality.message}</p>}
        </div>

        <div>
          <label className={labelClasses}>Historia (Cuento o trasfondo)</label>
          <textarea
            {...register('story')}
            rows={4}
            maxLength={4000}
            className={inputClasses}
            placeholder="Érase una vez una perrita que vivía en..."
          />
          {errors.story && <p className={errorClasses}>{errors.story.message}</p>}
        </div>

        <div>
          <label className={labelClasses}>Necesidades especiales</label>
          <textarea
            {...register('special_needs')}
            rows={2}
            maxLength={2000}
            className={inputClasses}
            placeholder="Ej: Dieta especial, medicación..."
          />
          {errors.special_needs && <p className={errorClasses}>{errors.special_needs.message}</p>}
        </div>
      </fieldset>

      {/* Estado (solo en edición) */}
      {mode === 'edit' && (
        <fieldset className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
          <legend className="px-2 text-sm font-bold text-surface-800">Estado</legend>
          <select {...register('status')} className={inputClasses + ' max-w-xs'}>
            <option value="available">Disponible</option>
            <option value="in_process">En proceso</option>
            <option value="adopted">Adoptado/a</option>
          </select>
        </fieldset>
      )}

      {/* Error banner */}
      {hasAttemptedSubmit && validationErrorCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 animate-fade-in">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">
              Hay {validationErrorCount} {validationErrorCount === 1 ? 'campo con error' : 'campos con errores'}
            </p>
            <p className="mt-1 text-rose-600">Revisa los campos marcados en rojo arriba y corrige los datos antes de continuar.</p>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          isLoading={isSubmitting}
          size="lg"
          onClick={() => setHasAttemptedSubmit(true)}
          aria-busy={isSubmitting}
        >
          {mode === 'create' ? '🐾 Registrar mascota' : '💾 Guardar cambios'}
        </Button>
      </div>
    </form>
  )
})
