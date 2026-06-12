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
  it('firestore.rules: deny-all (acceso solo vía Admin SDK)', () => {
    const rules = read('firestore.rules')
    expect(rules).toMatch(/match\s+\/\{document=\*\*\}/)
    expect(rules).toMatch(/allow\s+read,\s*write:\s*if\s+false/)
  })

  it('Cliente Firebase: sin API key hardcodeada en src', () => {
    const firebaseTs = read('src/lib/firebase-client.ts')
    expect(firebaseTs).toMatch(/process\.env\.NEXT_PUBLIC_FIREBASE/)
    expect(firebaseTs).not.toMatch(/apiKey:\s*['"]AIza/)
  })

  it('Cliente Firebase web no importa firestore/storage', () => {
    const firebaseTs = read('src/lib/firebase-client.ts')
    expect(firebaseTs).not.toMatch(/firebase\/firestore/)
    expect(firebaseTs).not.toMatch(/firebase\/storage/)
  })
})
