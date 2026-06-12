import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/constants/session'

/**
 * Chequeo rápido en el edge: solo verifica que exista la cookie de sesión.
 * La autorización real (rol, is_active) ocurre en los layouts de /admin
 * usando Firebase Admin SDK (Node runtime) — esta es solo una redirección
 * temprana para UX, no el límite de seguridad.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME)

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
