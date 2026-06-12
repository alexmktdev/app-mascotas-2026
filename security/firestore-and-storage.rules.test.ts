/**
 * Pruebas de reglas Firestore contra el emulador (requiere `npm run test:security`).
 *
 * Firestore es deny-all: el acceso real ocurre exclusivamente vía Firebase
 * Admin SDK desde el servidor de Next.js, que bypassa estas reglas. Estas
 * pruebas verifican que el SDK cliente (web) no tiene ningún acceso directo.
 */
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const PROJECT_ID = 'demo-mascotas-security'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(path.join(root, 'firestore.rules'), 'utf8'),
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

describe('Firestore — deny-all (acceso solo vía Admin SDK)', () => {
  it('invitado no puede leer pets', async () => {
    const anon = testEnv.unauthenticatedContext()
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('pets').doc('pet1').set({
        name: 'Luna',
        species: 'dog',
        status: 'available',
        created_at: new Date().toISOString(),
      })
    })
    await assertFails(anon.firestore().collection('pets').doc('pet1').get())
  })

  it('invitado no puede escribir en pets', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(
      anon.firestore().collection('pets').doc('evil').set({ name: 'x' }),
    )
  })

  it('invitado no puede leer colección arbitraria', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(anon.firestore().collection('secrets').doc('a').get())
  })

  it('usuario autenticado no puede leer su propio perfil', async () => {
    const user = testEnv.authenticatedContext('user-111')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('profiles').doc('user-111').set({
        role: 'staff',
        is_active: true,
        email: 'a@example.com',
      })
    })
    await assertFails(user.firestore().collection('profiles').doc('user-111').get())
  })

  it('usuario con rol staff no puede leer adoption_requests (sin Admin SDK)', async () => {
    const staff = testEnv.authenticatedContext('staff-1')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('profiles').doc('staff-1').set({
        role: 'staff',
        is_active: true,
      })
      await ctx.firestore().collection('adoption_requests').doc('r1').set({
        pet_id: 'p1',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    })
    await assertFails(staff.firestore().collection('adoption_requests').doc('r1').get())
  })

  it('invitado no puede leer audit_log', async () => {
    const anon = testEnv.unauthenticatedContext()
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('audit_log').doc('l1').set({ action: 'TEST' })
    })
    await assertFails(anon.firestore().collection('audit_log').doc('l1').get())
  })
})
