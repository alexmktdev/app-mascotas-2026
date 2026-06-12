import { Suspense } from 'react'
import { LoginForm } from '@/components/next/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-[75vh] items-center justify-center animate-fade-in px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
