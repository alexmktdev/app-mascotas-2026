'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase-client'
import { loginSchema, forgotPasswordSchema, type LoginFormData, type ForgotPasswordFormData } from '@/lib/validations'
import { Button } from '@/components/ui/Button'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isRecovery, setIsRecovery] = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const recoveryForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onLoginSubmit = async (data: LoginFormData) => {
    setServerError('')
    try {
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password)
      const idToken = await credential.user.getIdToken()

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      if (!res.ok) {
        throw new Error('No se pudo crear la sesión')
      }

      const next = searchParams.get('next') ?? '/admin'
      router.push(next)
      router.refresh()
    } catch {
      setServerError('Credenciales inválidas. Verifica tu correo y contraseña.')
    }
  }

  const onRecoverySubmit = async (data: ForgotPasswordFormData) => {
    setServerError('')
    setSuccessMessage('')
    try {
      await sendPasswordResetEmail(auth, data.email)
      setSuccessMessage('Si el correo pertenece a un usuario, recibirás un enlace para restablecer tu contraseña en unos minutos.')
    } catch {
      setServerError('Algo salió mal. Por favor, intenta más tarde.')
    }
  }

  const inputClasses = 'w-full rounded-lg border border-surface-200 bg-white px-4 py-3 text-sm shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20'

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-white p-8 shadow-xl shadow-surface-200/50 border border-surface-100">
        <div className="mb-6 text-center">
          <img
            src="/logo-login.png"
            alt="Municipalidad de Molina"
            className="mx-auto mb-4 h-28 w-auto object-contain"
          />
          <h1 className="text-xl font-extrabold text-surface-900">
            {isRecovery ? 'Recuperar Contraseña' : 'Acceso al Sistema'}
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-primary-600">
            Gestión de Adopción de Mascotas 2026
          </p>
        </div>

        {serverError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {serverError}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700">
            {successMessage}
          </div>
        )}

        {!isRecovery ? (
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">
                Correo electrónico
              </label>
              <input
                type="email"
                {...loginForm.register('email')}
                className={inputClasses}
                placeholder="correo@molina.cl"
                autoComplete="email"
              />
              {loginForm.formState.errors.email && (
                <p className="mt-1 text-xs text-rose-500">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-surface-700">Contraseña</label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  onClick={() => {
                    setIsRecovery(true)
                    setServerError('')
                    setSuccessMessage('')
                  }}
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...loginForm.register('password')}
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
              {loginForm.formState.errors.password && (
                <p className="mt-1 text-xs text-rose-500">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full gradient-molina border-0 hover:opacity-90"
              isLoading={loginForm.formState.isSubmitting}
            >
              Ingresar
            </Button>
          </form>
        ) : (
          <form onSubmit={recoveryForm.handleSubmit(onRecoverySubmit)} className="space-y-5">
            <p className="text-pretty text-center text-sm text-surface-600">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu cuenta.
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">
                Correo electrónico
              </label>
              <input
                type="email"
                {...recoveryForm.register('email')}
                className={inputClasses}
                placeholder="correo@molina.cl"
              />
              {recoveryForm.formState.errors.email && (
                <p className="mt-1 text-xs text-rose-500">{recoveryForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                size="lg"
                className="w-full gradient-molina border-0 hover:opacity-90"
                isLoading={recoveryForm.formState.isSubmitting}
              >
                Enviar enlace
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsRecovery(false)
                  setServerError('')
                  setSuccessMessage('')
                }}
                className="flex w-full items-center justify-center gap-2 text-sm font-medium text-surface-500 hover:text-surface-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Volver al login
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-[11px] text-surface-400 uppercase tracking-tighter">
          © 2026 MUNICIPALIDAD DE MOLINA · ADOPCIÓN DE MASCOTAS
        </p>
      </div>
    </div>
  )
}
