/**
 * Comprobaciones estáticas (sin emulador): políticas esperadas en archivos de reglas y código.
 */
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function read(p: string): string {
  return readFileSync(path.join(root, p), 'utf8')
}

describe('Política en archivos de reglas (estático)', () => {
  it('firestore.rules: mascotas sin escritura desde cliente', () => {
    const rules = read('firestore.rules')
    expect(rules).toMatch(/match\s+\/pets\/\{petId\}/)
    expect(rules).toMatch(/allow\s+write:\s*if\s+false/)
  })

  it('firestore.rules: perfiles sin escritura desde cliente', () => {
    const rules = read('firestore.rules')
    expect(rules).toMatch(/profiles\/\{userId\}/)
    expect(rules).toMatch(/allow\s+write:\s*if\s+false/)
  })

  it('firestore.rules: adoption_requests sin escritura desde cliente', () => {
    const rules = read('firestore.rules')
    expect(rules).toMatch(/adoption_requests/)
    expect(rules).toMatch(/allow\s+write:\s*if\s+false/)
  })

  it('storage.rules: pet-photos sin escritura desde SDK web', () => {
    const rules = read('storage.rules')
    expect(rules).toMatch(/pet-photos/)
    expect(rules).toMatch(/allow\s+write:\s*if\s+false/)
  })

  it('Cliente Firebase: sin API key hardcodeada en src', () => {
    const firebaseTs = read('src/lib/firebase.ts')
    expect(firebaseTs).toMatch(/import\.meta\.env\.VITE_FIREBASE/)
    expect(firebaseTs).not.toMatch(/apiKey:\s*['\"]AIza/)
  })
})
