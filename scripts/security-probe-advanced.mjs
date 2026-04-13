#!/usr/bin/env node
/**
 * Sondeo avanzado (solo TU proyecto). Amplía security-probe.mjs con:
 * - Límites de tamaño / Content-Type / método HTTP en Edge
 * - JSON malformado
 * - JWT artesanal (alg none, firma vacía)
 * - Escritura REST como anon (pets, profiles)
 * - Inyección de estilo en cuerpo JSON (no debe persistir si el INSERT falla)
 * - Ráfaga corta de peticiones sin auth
 *
 * Uso: npm run security:probe:advanced
 *
 * Mismas variables que security-probe (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY en .env.local).
 * Opcional: SECURITY_PROBE_ADMIN_JWT — segunda prueba de cuerpo >48KB hasta la función (espera 413).
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

async function fetchText(url, opts = {}) {
  const res = await fetch(url, opts)
  const text = await res.text()
  return { res, text }
}

/**
 * Mutación REST no debe filtrar filas actualizadas/borradas a un anon sin permiso.
 * 204 o 200 con cuerpo vacío / [] es aceptable; 200 con filas devueltas sería grave.
 */
function restMutationSafe(res, text) {
  if ([401, 403, 404, 406, 425].includes(res.status)) return true
  if (res.status === 204) return true
  if (res.status === 200) {
    const t = (text || '').trim()
    if (!t) return true
    try {
      const d = JSON.parse(t)
      if (Array.isArray(d)) return d.length === 0
      if (d && typeof d === 'object' && Object.keys(d).length === 0) return true
      return false
    } catch {
      return true
    }
  }
  return true
}

/** JWT mínimo con alg "none" y firma vacía (debe rechazarse). */
function buildNoneAlgJwt() {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
    'base64url',
  )
  const payload = Buffer.from(
    JSON.stringify({
      sub: randomUUID(),
      role: 'authenticated',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url')
  return `${header}.${payload}.`
}

async function main() {
  loadDotEnvFile(path.join(ROOT, '.env.local'))
  loadDotEnvFile(path.join(ROOT, '.env'))

  console.log('\n🔐 Security probe ADVANCED — solo tu proyecto\n')

  const baseUrl = envUrl()
  const anonKey = envAnon()

  if (!baseUrl || !anonKey) {
    console.error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local / entorno.')
    process.exit(1)
  }

  const edgeCreate = `${baseUrl}/functions/v1/create-user`
  const headersAnon = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  }

  try {
    // 1) Cuerpo enorme: con JWT inválido el gateway suele responder 401 antes del límite del runtime;
    //    413 indica que el rechazo es por tamaño (ideal con JWT admin: SECURITY_PROBE_ADMIN_JWT).
    const huge = JSON.stringify({ email: 'x'.repeat(55_000) })
    const r1 = await fetchText(edgeCreate, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: 'Bearer x',
        'Content-Type': 'application/json',
      },
      body: huge,
    })
    const adminTok = process.env.SECURITY_PROBE_ADMIN_JWT
    let hugeStatus = r1.res.status
    if (adminTok) {
      const r1b = await fetchText(edgeCreate, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${adminTok}`,
          'Content-Type': 'application/json',
        },
        body: huge,
      })
      hugeStatus = r1b.res.status
    }
    record(
      'Edge: body JSON > ~48KB (401=corte en gateway; 413=corte en función)',
      hugeStatus === 413 || hugeStatus === 401,
      `HTTP ${hugeStatus}${adminTok ? '' : ' — opcional: SECURITY_PROBE_ADMIN_JWT para forzar 413'}`,
    )

    // 2) Content-Type no JSON (JWT inválido → 401 es aceptable)
    const r2 = await fetchText(edgeCreate, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: 'Bearer x',
        'Content-Type': 'text/plain',
      },
      body: '{}',
    })
    record(
      'Edge: Content-Type text/plain',
      [401, 400, 415].includes(r2.res.status),
      `HTTP ${r2.res.status} — 401 si el gateway corta antes`,
    )

    // 3) Método GET
    const r3 = await fetchText(edgeCreate, {
      method: 'GET',
      headers: { apikey: anonKey },
    })
    record(
      'Edge: GET en create-user',
      [401, 404, 405].includes(r3.res.status),
      `HTTP ${r3.res.status}`,
    )

    // 4) JSON truncado
    const r4 = await fetchText(edgeCreate, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: 'Bearer x',
        'Content-Type': 'application/json',
      },
      body: '{"email":',
    })
    record(
      'Edge: JSON malformado',
      [401, 400].includes(r4.res.status),
      `HTTP ${r4.res.status} — 401 si corta por JWT antes del parse`,
    )

    // 5) JWT alg none
    const noneJwt = buildNoneAlgJwt()
    const r5 = await fetchText(`${baseUrl}/functions/v1/update-user`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${noneJwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: randomUUID(),
        first_name: 'a',
        last_name: 'b',
        email: 'n@e.co',
        role: 'staff',
        is_active: true,
      }),
    })
    record(
      'Edge: JWT con algoritmo none',
      r5.res.status === 401,
      `HTTP ${r5.res.status} — esperado 401`,
    )

    // 6) REST: anon intenta PATCH pets (UUID aleatorio)
    const fakePet = randomUUID()
    const r6 = await fetchText(
      `${baseUrl}/rest/v1/pets?id=eq.${fakePet}`,
      {
        method: 'PATCH',
        headers: {
          ...headersAnon,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ name: "hacked'; DROP TABLE pets;--" }),
      },
    )
    const safe6 = restMutationSafe(r6.res, r6.text)
    record(
      'REST: PATCH pets como anon (inyección en JSON; Prefer return=representation)',
      safe6,
      `HTTP ${r6.res.status} — no debe devolver filas actualizadas`,
    )

    // 7) REST: anon DELETE pets
    const r7 = await fetchText(`${baseUrl}/rest/v1/pets?id=eq.${fakePet}`, {
      method: 'DELETE',
      headers: { ...headersAnon, Prefer: 'return=representation' },
    })
    const safe7 = restMutationSafe(r7.res, r7.text)
    record(
      'REST: DELETE pets como anon',
      safe7,
      `HTTP ${r7.res.status} — no debe confirmar borrado con filas`,
    )

    // 8) REST: anon PATCH profiles ajenos
    const r8 = await fetchText(
      `${baseUrl}/rest/v1/profiles?id=eq.${randomUUID()}`,
      {
        method: 'PATCH',
        headers: {
          ...headersAnon,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ first_name: '<img src=x onerror=alert(1)>' }),
      },
    )
    const safe8 = restMutationSafe(r8.res, r8.text)
    record(
      'REST: PATCH profiles como anon (payload XSS en campo)',
      safe8,
      `HTTP ${r8.res.status} — no debe devolver perfil actualizado`,
    )

    // 9) REST: SELECT adoption_requests como anon (no debería ver filas sensibles)
    const r9 = await fetchText(
      `${baseUrl}/rest/v1/adoption_requests?select=id,email&limit=5`,
      { headers: headersAnon },
    )
    let rows = []
    try {
      rows = JSON.parse(r9.text)
    } catch {
      /* vacío */
    }
    const safeAdoption =
      r9.res.status === 401 ||
      (r9.res.status === 200 && Array.isArray(rows) && rows.length === 0)
    record(
      'REST: GET adoption_requests como anon',
      safeAdoption,
      r9.res.status === 200
        ? `filas=${rows.length} — esperado 0 o 401`
        : `HTTP ${r9.res.status}`,
    )

    // 10) Ráfaga: 12 POST sin token, todos 401
    const burst = await Promise.all(
      Array.from({ length: 12 }, () =>
        fetch(`${baseUrl}/functions/v1/delete-user`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: randomUUID() }),
        }),
      ),
    )
    const all401 = burst.every((r) => r.status === 401)
    record(
      'Edge: ráfaga 12× delete-user sin Authorization',
      all401,
      all401 ? 'todas 401' : `status distintos: ${burst.map((r) => r.status).join(',')}`,
    )
  } catch (e) {
    console.error('Error:', e.message)
    process.exit(1)
  }

  const failed = results.filter((r) => !r.ok)
  console.log('\n───')
  if (failed.length === 0) {
    console.log('Resumen: pruebas avanzadas OK con la configuración actual.')
  } else {
    console.log(`${failed.length} prueba(s) a revisar (puede variar según versión de Supabase).`)
    process.exitCode = 1
  }
}

main()
