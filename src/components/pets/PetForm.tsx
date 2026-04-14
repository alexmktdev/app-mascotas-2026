/**
 * Formulario de mascota reutilizable (crear / editar).
 * Fotos: Supabase Storage. Vista previa local vía blob recreado por archivo (compatible con Strict Mode).
 */

import { useCallback, useEffect, useMemo, useRef, useState, memo, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { petFormSchema, type PetFormData, type PetFormFields } from '@/lib/validations'
import { Button } from '@/components/ui/Button'
import { SPECIES_LABELS, GENDER_LABELS, PET_SIZE_LABELS } from '@/constants'
import {
  PET_PHOTO_ACCEPT_ATTR,
  PET_PHOTO_MAX_BYTES,
  PET_PHOTO_MAX_COUNT,
  PET_PHOTO_MAX_SIZE_LABEL_ES,
  PET_PHOTO_MIME_TYPES,
} from '@/constants'
import { PetPhotoImage } from '@/components/pets/PetPhotoImage'
import { isEphemeralImageRef } from '@/utils'
import { uploadPetPhoto } from '@/api/petPhotosStorage'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import type { Pet } from '@/types'
import toast from 'react-hot-toast'

/** Miniatura de un archivo local: crea blob en efecto y lo revoca al desmontar (no guardar esa URL en estado global). */
/** Miniatura de un archivo local: memoizada para evitar parpadeos/re-renders innecesarios. */
const LocalFilePreview = memo(function LocalFilePreview({ file, className }: { file: File; className?: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => {
      URL.revokeObjectURL(u)
    }
  }, [file])

  if (!url) {
    return <div className={`${className ?? ''} bg-surface-100 animate-pulse`} aria-hidden />
  }
  return <img src={url} alt="" className={className} />
})

type PhotoEntry =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; file: File; localId: string }

function buildDefaultFields(pet?: Partial<Pet>): PetFormFields {
  return {
    name: pet?.name ?? '',
    species: pet?.species ?? 'dog',
    breed: pet?.breed ?? '',
    age_months: pet?.age_months ?? 1,
    gender: pet?.gender ?? 'male',
    size: pet?.size ?? undefined,
    color: pet?.color ?? '',
    weight_kg: pet?.weight_kg ?? undefined,
    sterilized: pet?.sterilized ?? false,
    vaccinated: pet?.vaccinated ?? false,
    dewormed: pet?.dewormed ?? false,
    microchip: pet?.microchip ?? false,
    health_notes: pet?.health_notes ?? '',
    personality: pet?.personality ?? '',
    story: pet?.story ?? '',
    good_with_kids: pet?.good_with_kids ?? undefined,
    good_with_dogs: pet?.good_with_dogs ?? undefined,
    good_with_cats: pet?.good_with_cats ?? undefined,
    special_needs: pet?.special_needs ?? '',
    status: pet?.status ?? 'available',
    drive_folder_id: pet?.drive_folder_id ?? '',
    intake_date: pet?.intake_date ?? '',
  }
}

interface PetFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<Pet>
  /** Usuario autenticado (necesario para subir archivos al bucket). */
  userId: string | null | undefined
  onSubmit: (data: PetFormData) => void | Promise<void>
}

const allowedMime = new Set<string>(PET_PHOTO_MIME_TYPES)

export function PetForm({ mode, defaultValues, userId, onSubmit }: PetFormProps) {
  const [photoEntries, setPhotoEntries] = useState<PhotoEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitStage, setSubmitStage] = useState<'idle' | 'refresh' | 'upload' | 'save'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const petId = defaultValues?.id

  /**
   * Crear: un solo objeto de defaults por montaje (misma referencia siempre) y sin reset() en efecto — evita
   * que RHF vuelva a valores iniciales al escribir en textareas. Editar: defaults memoizados + reset al cambiar mascota/fotos.
   */
  const createDefaultsRef = useRef<PetFormFields | null>(null)
  if (mode === 'create' && !createDefaultsRef.current) {
    createDefaultsRef.current = buildDefaultFields()
  }

  const editDefaults = useMemo(() => {
    if (mode !== 'edit') return null
    return buildDefaultFields(defaultValues)
  }, [mode, petId, defaultValues?.photo_urls?.join('|'), defaultValues?.updated_at])

  const formDefaultValues = mode === 'create' ? createDefaultsRef.current! : editDefaults!

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PetFormFields>({
    resolver: zodResolver(petFormSchema),
    defaultValues: formDefaultValues,
  })

  /** Flag para saber si ya se intentó enviar (mostrar banner de errores solo después del primer intento). */
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const validationErrorCount = Object.keys(errors).length

  useEffect(() => {
    if (mode !== 'edit' || !petId || !editDefaults) return
    
    // Si el usuario ya está editando (isDirty), no sobreescribimos sus cambios con datos del servidor
    // a menos que cambie el ID de la mascota (cambio de página).
    if (isDirty && prevPetIdRef.current === petId) return
    
    reset(editDefaults)
    prevPetIdRef.current = petId
    
    if (defaultValues?.photo_urls?.length) {
      const persisted = defaultValues.photo_urls.filter((u) => !isEphemeralImageRef(u))
      setPhotoEntries(persisted.map((url) => ({ kind: 'existing' as const, url })))
    } else {
      setPhotoEntries([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, petId, editDefaults])

  const prevPetIdRef = useRef<string | undefined>(petId)

  const removeEntry = useCallback((index: number) => {
    setPhotoEntries((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addNewPhoto = useCallback((file: File) => {
    if (photoEntries.length >= PET_PHOTO_MAX_COUNT) return
    if (file.size > PET_PHOTO_MAX_BYTES) {
      toast.error(`Cada imagen puede pesar como máximo ${PET_PHOTO_MAX_SIZE_LABEL_ES}`)
      return
    }
    if (!allowedMime.has(file.type)) {
      toast.error('Formato no permitido (JPEG, PNG, WebP o GIF)')
      return
    }
    setPhotoEntries((prev) => [...prev, { kind: 'new', file, localId: crypto.randomUUID() }])
  }, [photoEntries.length])

  const onFilePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) addNewPhoto(file)
  }



  const submit = handleSubmit(
    async (data) => {
      const hasNew = photoEntries.some((e) => e.kind === 'new')
      if (hasNew && !userId) {
        toast.error('Debes iniciar sesión para subir fotos')
        return
      }

    setSubmitting(true)
    setSubmitStage('refresh')
    /** Por si alguna promesa no termina nunca: evita botón colgado sin F5 (p. ej. pestaña en segundo plano). */
    const safetyMs = 150_000
    const safetyId = window.setTimeout(() => {
      setSubmitting(false)
      setSubmitStage('idle')
      toast.error(
        'La operación está tardando demasiado. Se desbloqueó el formulario para que puedas reintentar.',
      )
    }, safetyMs)
    try {
      setSubmitStage('upload')
      const photo_urls: string[] = []
      for (const e of photoEntries) {
        if (e.kind === 'existing') {
          if (!isEphemeralImageRef(e.url)) photo_urls.push(e.url)
        } else {
          photo_urls.push(await uploadPetPhoto(userId!, e.file))
        }
      }

      setSubmitStage('save')
      await onSubmit({ ...data, photo_urls })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudieron subir las fotos'
      toast.error(msg)
    } finally {
      window.clearTimeout(safetyId)
      setSubmitting(false)
      setSubmitStage('idle')
    }
  },
  // RHF onInvalid — se ejecuta cuando la validación de Zod falla
  (_validationErrors) => {
    setHasAttemptedSubmit(true)
    if (import.meta.env.DEV) {
      console.warn('[PetForm] Errores de validación:', _validationErrors)
    }
    toast.error('Revisa los campos marcados en rojo antes de continuar.')
  })

  /** Solo `submitting`: incluye subida de fotos + `await onSubmit` (mutación). `isPending` del padre era redundante y podía desincronizarse. */
  const buttonLoading = submitting

  const inputClasses = 'w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'
  const labelClasses = 'mb-1 block text-sm font-medium text-surface-700'
  const errorClasses = 'mt-1 text-xs text-rose-500'
  const checkboxClasses = 'h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500'

  return (
    <form onSubmit={submit} className="space-y-8">
      <input
        ref={fileInputRef}
        type="file"
        accept={PET_PHOTO_ACCEPT_ATTR}
        className="hidden"
        aria-label="Seleccionar imagen para la ficha de la mascota"
        onChange={onFilePick}
      />

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
            <input type="number" {...register('age_months', { valueAsNumber: true })} className={inputClasses} min={0} />
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
            <label className={labelClasses}>Peso (kg)</label>
            <input type="number" step="0.1" {...register('weight_kg', { valueAsNumber: true })} className={inputClasses} />
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
        <legend className="px-2 text-sm font-bold text-surface-800">Personalidad y compatibilidad</legend>

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('good_with_kids')} className={checkboxClasses} />
            <span className="text-sm text-surface-700">Bueno con niños</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('good_with_dogs')} className={checkboxClasses} />
            <span className="text-sm text-surface-700">Bueno con perros</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('good_with_cats')} className={checkboxClasses} />
            <span className="text-sm text-surface-700">Bueno con gatos</span>
          </label>
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

      {/* Fotos */}
      <fieldset className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
        <legend className="px-2 text-sm font-bold text-surface-800">Fotos (Supabase Storage)</legend>
        <p className="text-sm text-surface-500">
          Hasta {PET_PHOTO_MAX_COUNT} imágenes, máximo {PET_PHOTO_MAX_SIZE_LABEL_ES} cada una (JPEG, PNG, WebP o GIF).
        </p>

        {photoEntries.map((entry, index) => (
          <div
            key={entry.kind === 'existing' ? entry.url : entry.localId}
            className="flex items-start gap-3"
          >
            <div className="flex-1">
              <p className="text-xs font-medium text-surface-600">
                {entry.kind === 'existing' ? 'Foto guardada' : 'Nueva foto'}
              </p>
              <div className="mt-2 h-28 w-28 overflow-hidden rounded-lg border border-surface-200">
                {entry.kind === 'existing' ? (
                  <PetPhotoImage photoRef={entry.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <LocalFilePreview file={entry.file} className="h-full w-full object-cover" />
                )}
              </div>
            </div>
            <Button type="button" variant="danger" size="sm" onClick={() => removeEntry(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {photoEntries.length < PET_PHOTO_MAX_COUNT && (
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Plus className="h-4 w-4" />
            Agregar foto
          </Button>
        )}
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

      {/* Error banner — visible después del primer intento fallido de envío */}
      {hasAttemptedSubmit && validationErrorCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 animate-fade-in">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Hay {validationErrorCount} {validationErrorCount === 1 ? 'campo con error' : 'campos con errores'}</p>
            <p className="mt-1 text-rose-600">Revisa los campos marcados en rojo arriba y corrige los datos antes de continuar.</p>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" isLoading={buttonLoading} size="lg" onClick={() => setHasAttemptedSubmit(true)} aria-busy={buttonLoading}>
          {mode === 'create' ? '🐾 Registrar mascota' : '💾 Guardar cambios'}
        </Button>
      </div>
      {submitting && (
        <p className="text-right text-xs font-medium text-surface-500 animate-pulse">
          {submitStage === 'save'
            ? '💾 Guardando ficha en el servidor...'
            : submitStage === 'upload'
              ? '📷 Subiendo o preparando fotos...'
              : '⏳ Enviando…'}
        </p>
      )}
    </form>
  )
}
