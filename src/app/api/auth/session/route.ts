import { NextResponse } from 'next/server'
import { createSessionCookie } from '@/server/session'

export async function POST(request: Request): Promise<NextResponse> {
  let idToken: string | undefined
  try {
    const body = await request.json()
    idToken = typeof body?.idToken === 'string' ? body.idToken : undefined
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 })
  }

  if (!idToken) {
    return NextResponse.json({ error: 'idToken es requerido' }, { status: 400 })
  }

  try {
    await createSessionCookie(idToken)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'No se pudo iniciar sesión' }, { status: 401 })
  }
}
