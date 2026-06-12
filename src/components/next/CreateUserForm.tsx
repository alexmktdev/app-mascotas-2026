'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { createUserSchema, type CreateUserFormData } from '@/lib/validations'
import { createUserAction } from '@/server/users-actions'
import { Button } from '@/components/ui/Button'
import { ROLE_LABELS } from '@/constants'

export function CreateUserForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'staff' },
  })

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set('email', data.email)
      formData.set('password', data.password)
      formData.set('first_name', data.first_name)
      formData.set('last_name', data.last_name)
      formData.set('role', data.role)

      const result = await createUserAction(formData)
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
        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
          Crear usuario
        </Button>
      </div>
    </form>
  )
}
