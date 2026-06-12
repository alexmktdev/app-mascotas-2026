/**
 * Firebase SDK del navegador — SOLO Auth.
 * Firestore y Storage se acceden exclusivamente desde el servidor
 * (ver src/lib/firebase-admin.ts y src/server/*).
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function getFirebaseApp(): FirebaseApp {
  const existing = getApps()
  if (existing.length > 0) return existing[0]!
  return initializeApp(firebaseConfig)
}

export const auth: Auth = getAuth(getFirebaseApp())
