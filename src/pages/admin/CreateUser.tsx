/**
 * Página: Crear usuario (solo admin).
 * Usa Edge Function (clave solo en servidor de Supabase).
 */

import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, type CreateUserFormData } from '@/lib/validations'
import { useCreateUser } from '@/hooks/useUsers'
import { Button } from '@/components/ui/Button'
import { ROLE_LABELS } from '@/constants'

export default function CreateUser() {
  const navigate = useNavigate()
  const createUser = useCreateUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'staff' },
  })

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      console.log('Iniciando creación de usuario...', data.email)
      await createUser.mutateAsync(data)
      navigate('/admin/users')
    } catch (err) {
      console.error('Error capturado en el formulario:', err)
      // El error ya es manejado por el hook useCreateUser con un toast
    }
  }

  const inputClasses = 'w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'
  const labelClasses = 'mb-1 block text-sm font-medium text-surface-700'
  const errorClasses = 'mt-1 text-xs text-rose-500'

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900">Crear usuario</h1>
        <p className="text-sm text-surface-500">Registra un nuevo usuario del sistema</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClasses}>Nombre *</label>
            <input {...register('first_name')} className={inputClasses} placeholder="Juan" />
            {errors.first_name && <p className={errorClasses}>{errors.first_name.message}</p>}
          </div>
          <div>
            <label className={labelClasses}>Apellido *</label>
            <input {...register('last_name')} className={inputClasses} placeholder="Pérez" />
            {errors.last_name && <p className={errorClasses}>{errors.last_name.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelClasses}>Correo electrónico *</label>
          <input type="email" {...register('email')} className={inputClasses} placeholder="correo@ejemplo.com" />
          {errors.email && <p className={errorClasses}>{errors.email.message}</p>}
        </div>

        <div>
          <label className={labelClasses}>Contraseña *</label>
          <input type="password" {...register('password')} className={inputClasses} placeholder="Mínimo 8 caracteres" />
          {errors.password && <p className={errorClasses}>{errors.password.message}</p>}
          <p className="mt-1 text-xs text-surface-400">Al menos 1 mayúscula, 1 minúscula y 1 número</p>
        </div>

        <div>
          <label className={labelClasses}>Rol *</label>
          <select {...register('role')} className={inputClasses}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {errors.role && <p className={errorClasses}>{errors.role.message}</p>}
        </div>

        <div className="pt-2">
          <Button type="submit" size="lg" className="w-full" isLoading={createUser.isPending}>
            Crear usuario
          </Button>
        </div>
      </form>
    </div>
  )
}
