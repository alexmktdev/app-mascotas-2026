'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { editUserSchema, type EditUserFormData } from '@/lib/validations'
import { updateUserAction } from '@/server/users-actions'
import { Button } from '@/components/ui/Button'
import { ROLE_LABELS } from '@/constants'
import type { Profile } from '@/types/firebase.types'

interface EditUserFormProps {
  user: Profile
}

export function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      password: '',
    },
  })

  const onSubmit = async (data: EditUserFormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set('first_name', data.first_name)
      formData.set('last_name', data.last_name)
      formData.set('email', data.email)
      formData.set('role', data.role)
      formData.set('is_active', String(data.is_active))
      if (data.password) formData.set('password', data.password)

      const result = await updateUserAction(user.id, formData)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      router.push('/admin/users')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClasses = 'w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'
  const labelClasses = 'mb-1 block text-sm font-medium text-surface-700'
  const errorClasses = 'mt-1 text-xs text-rose-500'

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClasses}>Nombre *</label>
          <input {...register('first_name')} className={inputClasses} />
          {errors.first_name && <p className={errorClasses}>{errors.first_name.message}</p>}
        </div>
        <div>
          <label className={labelClasses}>Apellido *</label>
          <input {...register('last_name')} className={inputClasses} />
          {errors.last_name && <p className={errorClasses}>{errors.last_name.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClasses}>Correo electrónico *</label>
        <input type="email" {...register('email')} className={inputClasses} />
        {errors.email && <p className={errorClasses}>{errors.email.message}</p>}
      </div>

      <div>
        <label className={labelClasses}>Nueva contraseña</label>
        <input type="password" {...register('password')} className={inputClasses} placeholder="Dejar vacío para no cambiar" autoComplete="new-password" />
        {errors.password && <p className={errorClasses}>{errors.password.message}</p>}
        <p className="mt-1 text-xs text-surface-400">
          Solo completa este campo si quieres restablecer la contraseña
        </p>
      </div>

      <div>
        <label className={labelClasses}>Rol *</label>
        <select {...register('role')} className={inputClasses}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.role && <p className={errorClasses}>{errors.role.message}</p>}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-surface-100 bg-surface-50/80 px-4 py-3">
        <Controller
          name="is_active"
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              id="is_active"
              checked={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
            />
          )}
        />
        <label htmlFor="is_active" className="text-sm font-medium text-surface-700">
          Usuario activo (puede iniciar sesión)
        </label>
      </div>
      {errors.is_active && <p className={errorClasses}>{errors.is_active.message}</p>}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => router.push('/admin/users')}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}
