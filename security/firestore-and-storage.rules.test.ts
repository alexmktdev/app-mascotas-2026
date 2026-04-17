/**
 * Pruebas de reglas Firestore y Storage contra el emulador (requiere `npm run test:security`).
 */
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
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
    storage: {
      rules: readFileSync(path.join(root, 'storage.rules'), 'utf8'),
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.clearStorage()
})

describe('Firestore — lecturas públicas y denegadas', () => {
  it('invitado puede leer una mascota (listado público)', async () => {
    const anon = testEnv.unauthenticatedContext()
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('pets').doc('pet1').set({
        name: 'Luna',
        species: 'dog',
        status: 'available',
        created_at: new Date().toISOString(),
      })
    })
    const snap = await assertSucceeds(anon.firestore().collection('pets').doc('pet1').get())
    expect(snap.exists).toBe(true)
  })

  it('invitado no puede escribir en pets', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(
      anon.firestore().collection('pets').doc('evil').set({ name: 'x' }),
    )
  })

  it('invitado no puede leer colección arbitraria (catch-all deny)', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(anon.firestore().collection('secrets').doc('a').get())
  })

  it('usuario autenticado puede leer su propio perfil (aunque no exista doc)', async () => {
    const user = testEnv.authenticatedContext('user-111')
    await assertSucceeds(user.firestore().collection('profiles').doc('user-111').get())
  })

  it('usuario autenticado no puede leer perfil de otro (sin rol staff/admin)', async () => {
    const user = testEnv.authenticatedContext('user-111')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('profiles').doc('user-222').set({
        role: 'staff',
        is_active: true,
        email: 'b@example.com',
      })
    })
    await assertFails(user.firestore().collection('profiles').doc('user-222').get())
  })

  it('staff puede leer perfiles ajenos', async () => {
    const staff = testEnv.authenticatedContext('staff-1')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('profiles').doc('staff-1').set({
        role: 'staff',
        is_active: true,
        email: 's@example.com',
      })
      await ctx.firestore().collection('profiles').doc('user-999').set({
        role: 'admin',
        is_active: true,
        email: 'a@example.com',
      })
    })
    const snap = await assertSucceeds(
      staff.firestore().collection('profiles').doc('user-999').get(),
    )
    expect(snap.exists).toBe(true)
  })

  it('invitado no puede leer adoption_requests', async () => {
    const anon = testEnv.unauthenticatedContext()
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('adoption_requests').doc('r1').set({
        pet_id: 'p1',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    })
    await assertFails(anon.firestore().collection('adoption_requests').doc('r1').get())
  })

  it('staff puede leer adoption_requests', async () => {
    const staffReader = testEnv.authenticatedContext('staff-2')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('profiles').doc('staff-2').set({
        role: 'staff',
        is_active: true,
      })
      await ctx.firestore().collection('adoption_requests').doc('r2').set({
        pet_id: 'p1',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    })
    await assertSucceeds(
      staffReader.firestore().collection('adoption_requests').doc('r2').get(),
    )
  })

  it('usuario autenticado con perfil que no es staff/admin no puede leer adoption_requests', async () => {
    const plain = testEnv.authenticatedContext('plain-1')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('profiles').doc('plain-1').set({
        role: 'citizen',
        is_active: true,
      })
      await ctx.firestore().collection('adoption_requests').doc('r3').set({
        pet_id: 'p1',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
    })
    await assertFails(
      plain.firestore().collection('adoption_requests').doc('r3').get(),
    )
  })

  it('invitado no puede escribir adoption_requests', async () => {
    const anon = testEnv.unauthenticatedContext()
    await assertFails(
      anon.firestore().collection('adoption_requests').doc('x').set({ pet_id: 'p' }),
    )
  })

  it('invitado no puede leer audit_log (solo auth)', async () => {
    const anon = testEnv.unauthenticatedContext()
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('audit_log').doc('l1').set({ action: 'TEST' })
    })
    await assertFails(anon.firestore().collection('audit_log').doc('l1').get())
  })

  it('cualquier usuario autenticado puede leer audit_log (regla actual)', async () => {
    const anyUser = testEnv.authenticatedContext('any-1')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('audit_log').doc('l1').set({ action: 'TEST' })
    })
    await assertSucceeds(anyUser.firestore().collection('audit_log').doc('l1').get())
  })
})

describe('Storage — pet-photos', () => {
  it('invitado puede leer un objeto en pet-photos', async () => {
    const anon = testEnv.unauthenticatedContext()
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = ctx.storage().ref('pet-photos/demo/placeholder.webp')
      await ref.putString('fake', 'raw', { contentType: 'image/webp' })
    })
    const ref = anon.storage().ref('pet-photos/demo/placeholder.webp')
    const url = await assertSucceeds(ref.getDownloadURL())
    expect(url).toContain('http')
  })

  it('invitado no puede subir a pet-photos', async () => {
    const anon = testEnv.unauthenticatedContext()
    const ref = anon.storage().ref(`pet-photos/demo/${Date.now()}.webp`)
    await assertFails(ref.putString('x', 'raw', { contentType: 'image/webp' }))
  })

  it('rutas fuera de pet-photos no son legibles para invitado', async () => {
    const anon = testEnv.unauthenticatedContext()
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.storage().ref('private/secret.txt').putString('secret', 'raw', {
        contentType: 'text/plain',
      })
    })
    await assertFails(anon.storage().ref('private/secret.txt').getDownloadURL())
  })
})
