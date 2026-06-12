import 'server-only'

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

function getAdminApp(): App {
  const existing = getApps()
  if (existing.length > 0) return existing[0]!

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Faltan variables de entorno de Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)',
    )
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  })
}

/**
 * Proxy perezoso: difiere la inicialización (y la validación de env vars)
 * hasta el primer acceso real en tiempo de request, para no romper la
 * recolección de configuración/páginas de `next build` cuando las
 * credenciales de Admin SDK aún no están configuradas.
 */
function lazy<T extends object>(factory: () => T): T {
  let instance: T | undefined
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      if (!instance) instance = factory()
      return Reflect.get(instance as object, prop, receiver)
    },
  })
}

export const adminAuth: Auth = lazy(() => getAuth(getAdminApp()))
export const adminDb: Firestore = lazy(() => getFirestore(getAdminApp()))
