#!/usr/bin/env node
/**
 * Falla si aparece service_role / SERVICE_ROLE en src/ (no debe ir al bundle del cliente).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcRoot = path.join(__dirname, '..', 'src')

function walk(dir) {
  const out = []
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name)
    if (name.isDirectory()) {
      out.push(...walk(p))
    } else if (/\.(ts|tsx)$/.test(name.name)) {
      out.push(p)
    }
  }
  return out
}

const pattern = /service[_-]?role|SERVICE_ROLE_KEY/i
const bad = walk(srcRoot).filter((f) => pattern.test(fs.readFileSync(f, 'utf8')))

if (bad.length) {
  console.error('No debe aparecer service_role en src/:')
  for (const f of bad) console.error(' ', f)
  process.exit(1)
}
console.log('OK: sin service_role en src/')
