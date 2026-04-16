/**
 * Página: Editar usuario (solo admin). Sincroniza Auth y tabla profiles vía Edge Function.
 */

import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { editUserSchema, type EditUserFormData } from '@/lib/validations'
import { useUser, useUpdateUser } from '@/hooks/useUsers'
import { Button } from '@/components/ui/Button'
import { ROLE_LABELS } from '@/constants'
import { Skeleton } from '@/components/ui/Skeleton'

export default function EditUser() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user, isLoading, isError } = useUser(id)
  const updateUser = useUpdateUser()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  })

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        password: '',
      })
    }
  }, [user, reset])

  const onSubmit = async (data: EditUserFormData) => {
    if (!id) return
    try {
      await updateUser.mutateAsync({
        id,
        updates: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          role: data.role,
          is_active: data.is_active,
        },
      })
      navigate('/admin/users')
    } catch {
      // Toast en el hook
    }
  }

  const inputClasses =
    'w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'
  const labelClasses = 'mb-1 block text-sm font-medium text-surface-700'
  const errorClasses = 'mt-1 text-xs text-rose-500'

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="mx-auto max-w-lg animate-fade-in">
        <p className="text-surface-600">No se encontró el usuario.</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate('/admin/users')}>
          Volver a la lista
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900">Editar usuario</h1>
        <p className="text-sm text-surface-500">
          {user.first_name} {user.last_name} — {user.email}
        </p>
      </div>

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
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={updateUser.isPending}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  )
}
