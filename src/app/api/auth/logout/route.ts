import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { getSessionUser, clearSessionCookie } from '@/server/session'

export async function POST(): Promise<NextResponse> {
  const session = await getSessionUser()
  if (session) {
    try {
      await adminAuth.revokeRefreshTokens(session.uid)
    } catch {
      // No bloquear el logout si la revocación falla.
    }
  }
  await clearSessionCookie()
  return NextResponse.json({ success: true })
}
