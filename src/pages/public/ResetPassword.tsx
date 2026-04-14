import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isDone, setIsDone] = useState(false)
  const [isValidating, setIsValidating] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    // Verificar que tenemos una sesión activa (el enlace de recuperación crea una sesión temporal)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setServerError('El enlace de recuperación ha expirado o no es válido. Por favor, solicita uno nuevo.')
      }
      setIsValidating(false)
    }
    checkSession()
  }, [])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError('')
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })
      if (error) throw error
      setIsDone(true)
      // Redirigir al login tras 3 segundos
      setTimeout(() => navigate('/login'), 3000)
    } catch (error) {
      setServerError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
      console.error('Reset error:', error)
    }
  }

  const inputClasses = 'w-full rounded-lg border border-surface-200 bg-white px-4 py-3 text-sm shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20'

  if (isValidating) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center">
        <div className="animate-pulse text-surface-400 font-medium">Verificando enlace...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center animate-fade-in px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl shadow-surface-200/50 border border-surface-100">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-extrabold text-surface-900">Nueva Contraseña</h1>
            <p className="mt-1 text-sm text-surface-500">
              Establece una contraseña segura para tu cuenta de administrador.
            </p>
          </div>

          {isDone ? (
            <div className="space-y-4 py-4 text-center">
              <div className="rounded-lg bg-teal-50 p-4 text-sm text-teal-700 border border-teal-100">
                ¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...
              </div>
              <Button onClick={() => navigate('/login')} variant="primary" className="w-full">
                Ir al Login ahora
              </Button>
            </div>
          ) : (
            <>
              {serverError && (
                <div className="mb-6 flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Error</p>
                    <p>{serverError}</p>
                    <button 
                      onClick={() => navigate('/login')}
                      className="mt-2 font-bold underline hover:text-rose-800"
                    >
                      Volver a solicitar enlace
                    </button>
                  </div>
                </div>
              )}

              {!serverError && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-surface-700">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        className={inputClasses + ' pr-10'}
                        placeholder="••••••••"
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

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-surface-700">
                      Confirmar Contraseña
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      className={inputClasses}
                      placeholder="••••••••"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-rose-500">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gradient-molina border-0 hover:opacity-90"
                    isLoading={isSubmitting}
                  >
                    Actualizar contraseña
                  </Button>
                </form>
              )}
            </>
          )}

          <p className="mt-6 text-center text-[11px] text-surface-400 uppercase tracking-tighter">
            © 2026 MUNICIPALIDAD DE MOLINA · SEGURIDAD
          </p>
        </div>
      </div>
    </div>
  )
}
