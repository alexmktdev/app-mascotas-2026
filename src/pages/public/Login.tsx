/**
 * Página de login — Estilo Municipalidad de Molina.
 * Adaptado para el sistema de Adopción de Mascotas.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setServerError('')
    try {
      await login(data.email, data.password)
      navigate('/admin')
    } catch (error) {
      setServerError(
        error instanceof Error
          ? 'Credenciales inválidas. Verifica tu correo y contraseña.'
          : 'Error de conexión. Intenta nuevamente.'
      )
    }
  }

  const inputClasses = 'w-full rounded-lg border border-surface-200 bg-white px-4 py-3 text-sm shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20'

  return (
    <div className="flex min-h-[75vh] items-center justify-center animate-fade-in">
      <div className="w-full max-w-md">
        {/* Card blanca estilo Molina */}
        <div className="rounded-2xl bg-white p-8 shadow-xl shadow-surface-200/50 border border-surface-100">
          {/* Logo Molina */}
          <div className="mb-6 text-center">
            <img
              src="/logo-login.png"
              alt="Municipalidad de Molina"
              className="mx-auto mb-4 h-28 w-auto object-contain"
            />
            <h1 className="text-xl font-extrabold text-surface-900">Acceso al Sistema</h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-primary-600">
              Gestión de Adopción de Mascotas 2026
            </p>
          </div>

          {/* Error del servidor */}
          {serverError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">
                Correo electrónico
              </label>
              <input
                type="email"
                {...register('email')}
                className={inputClasses}
                placeholder="correo@molina.cl"
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-surface-700">Contraseña</label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  onClick={() => alert('Contacta al administrador para restablecer tu contraseña.')}
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={inputClasses + ' pr-10'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full gradient-molina border-0 hover:opacity-90"
              isLoading={isSubmitting}
            >
              Ingresar
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-surface-400">
            © 2026 MUNICIPALIDAD DE MOLINA · ADOPCIÓN DE MASCOTAS 2026
          </p>
        </div>
      </div>
    </div>
  )
}
