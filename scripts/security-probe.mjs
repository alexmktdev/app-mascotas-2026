#!/usr/bin/env node
/**
 * Sondeo de seguridad (solo contra TU proyecto).
 *
 * No sustituye un pentest. Prueba límites típicos: Edge sin JWT, JWT basura,
 * REST con rol anónimo, INSERT de adopción con mascota inválida (si aplica RLS 002).
 *
 * Uso:
 *   npm run security:probe
 *
 * Variables (o .env.local con VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY):
 *   VITE_SUPABASE_URL o SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY o SUPABASE_ANON_KEY
 * Opcional:
 *   SECURITY_PROBE_STAFF_JWT   → espera 403 al llamar create-user
 *   SECURITY_PROBE_ADMIN_JWT   → espera 2xx/4xx de validación, no 401 (smoke admin)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const text = fs.readFileSync(filePath, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

function envUrl() {
  return (
    process.env.VITE_SUPABASE_URL?.replace(/\/$/, '') ||
    process.env.SUPABASE_URL?.replace(/\/$/, '') ||
    ''
  )
}

function envAnon() {
  return process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
}

const results = []

function record(name, ok, detail) {
  results.push({ name, ok, detail })
  const icon = ok ? '✓' : '✗'
  console.log(`${icon} ${name}`)
  if (detail) console.log(`    ${detail}`)
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts)
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { _raw: text.slice(0, 200) }
  }
  return { res, text, json }
}

async function probeEdgeNoAuth(baseUrl, anonKey) {
  const url = `${baseUrl}/functions/v1/create-user`
  const { res, json } = await fetchJson(url, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  const ok = res.status === 401
  record(
    'Edge create-user sin Authorization',
    ok,
    `HTTP ${res.status} — esperado 401. Body: ${JSON.stringify(json)?.slice(0, 120)}`,
  )
}

async function probeEdgeGarbageJwt(baseUrl, anonKey) {
  const url = `${baseUrl}/functions/v1/delete-user`
  const { res } = await fetchJson(url, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: 'Bearer definitivamente-no-es-un-jwt-valido',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: randomUUID() }),
  })
  const ok = res.status === 401
  record(
    'Edge delete-user con JWT basura',
    ok,
    `HTTP ${res.status} — esperado 401`,
  )
}

async function probeEdgeStaffBlocked(baseUrl, anonKey) {
  const token = process.env.SECURITY_PROBE_STAFF_JWT
  if (!token) {
    record(
      'Edge create-user con JWT de staff (omitido)',
      true,
      'Define SECURITY_PROBE_STAFF_JWT para probar 403',
    )
    return
  }
  const url = `${baseUrl}/functions/v1/create-user`
  const { res } = await fetchJson(url, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: `probe_${Date.now()}@example.invalid`,
      password: 'Probe1234',
      first_name: 'Probe',
      last_name: 'Security',
      role: 'staff',
    }),
  })
  const ok = res.status === 403
  record(
    'Edge create-user con sesión staff → debe ser 403',
    ok,
    `HTTP ${res.status} — esperado 403`,
  )
}

async function probeEdgeAdminSmoke(baseUrl, anonKey) {
  const token = process.env.SECURITY_PROBE_ADMIN_JWT
  if (!token) {
    record(
      'Edge create-user con JWT admin (omitido)',
      true,
      'Define SECURITY_PROBE_ADMIN_JWT solo para smoke (crearía usuario de prueba si el body fuera válido)',
    )
    return
  }
  const url = `${baseUrl}/functions/v1/create-user`
  const { res, json } = await fetchJson(url, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  const ok = res.status !== 401 && res.status !== 403
  record(
    'Edge create-user admin: no 401/403 con body vacío (error de validación)',
    ok,
    `HTTP ${res.status} — ${JSON.stringify(json)?.slice(0, 100)}`,
  )
}

async function probeRestProfilesAnon(baseUrl, anonKey) {
  const url = `${baseUrl}/rest/v1/profiles?select=id&limit=5`
  const { res, json } = await fetchJson(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  })
  const rows = Array.isArray(json) ? json : []
  const ok = res.status === 200 && rows.length === 0
  record(
    'REST GET profiles como anon (sin usuario)',
    ok,
    ok
      ? '0 filas — RLS no expone perfiles ajenos'
      : `HTTP ${res.status}, filas=${rows.length} — revisa políticas si ves datos`,
  )
}

async function probeAdoptionInvalidPet(baseUrl, anonKey) {
  const url = `${baseUrl}/rest/v1/adoption_requests`
  const fakePet = randomUUID()
  const body = {
    pet_id: fakePet,
    full_name: 'Security Probe',
    email: 'probe@example.invalid',
    phone: '0000000000',
    id_number: 'PROBE',
    address: 'N/A',
    city: 'N/A',
    motivation: 'Automated security probe — should be rejected',
  }
  const { res, json } = await fetchJson(url, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  })
  const rejected = res.status >= 400
  record(
    'REST INSERT adoption_requests con pet_id que no existe en pets',
    rejected,
    rejected
      ? `HTTP ${res.status} — esperado (FK en DB y/o política de migración 002)`
      : `HTTP ${res.status} — si es 2xx, revisa integridad referencial y RLS`,
  )
  if (!rejected && json) console.log(`    detalle: ${JSON.stringify(json).slice(0, 160)}`)
}

async function main() {
  loadDotEnvFile(path.join(ROOT, '.env.local'))
  loadDotEnvFile(path.join(ROOT, '.env'))

  console.log('\n🔒 Security probe — solo usar contra proyectos propios\n')

  const baseUrl = envUrl()
  const anonKey = envAnon()

  if (!baseUrl || !anonKey) {
    console.error(
      'Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (o SUPABASE_*) en .env.local / entorno.',
    )
    process.exit(1)
  }

  try {
    await probeEdgeNoAuth(baseUrl, anonKey)
    await probeEdgeGarbageJwt(baseUrl, anonKey)
    await probeEdgeStaffBlocked(baseUrl, anonKey)
    await probeEdgeAdminSmoke(baseUrl, anonKey)
    await probeRestProfilesAnon(baseUrl, anonKey)
    await probeAdoptionInvalidPet(baseUrl, anonKey)
  } catch (e) {
    console.error('Error de red o fetch:', e.message)
    process.exit(1)
  }

  const failed = results.filter((r) => !r.ok)
  console.log('\n───')
  if (failed.length === 0) {
    console.log('Resumen: todas las comprobaciones esperadas pasaron (con las pruebas configuradas).')
  } else {
    console.log(`Resumen: ${failed.length} comprobación(es) revisar arriba.`)
    process.exitCode = 1
  }
}

main()
