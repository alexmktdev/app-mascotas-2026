#!/usr/bin/env node
/**
 * Auditoría de seguridad ampliada (segundo nivel).
 *
 * Automatiza lo que es razonable sin producción ni credenciales reales.
 * Lo que no se puede probar aquí queda como MANUAL o SKIP.
 *
 * Uso:
 *   node scripts/security-audit-extended.mjs
 *   SECURITY_AUDIT_URL=https://app-mascotas-2026.vercel.app node scripts/security-audit-extended.mjs
 *
 * Variables opcionales:
 *   SECURITY_AUDIT_URL — URL pública (HEAD) para HTTPS y cabeceras de seguridad
 *   SECURITY_AUDIT_WARN_ONLY=1 — no sale con código 1 por npm audit (solo avisos)
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const WARN_ONLY = process.env.SECURITY_AUDIT_WARN_ONLY === '1'
const AUDIT_URL = process.env.SECURITY_AUDIT_URL?.trim()

/** @typedef {{ id: string; status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP' | 'MANUAL'; detail?: string }} Row */

/** @type {Row[]} */
const rows = []

function add(id, status, detail = '') {
  rows.push({ id, status, detail })
}

function gitLsFiles() {
  try {
    const out = execSync('git ls-files', { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((p) => !p.startsWith('node_modules/') && !p.includes('/node_modules/'))
  } catch {
    return null
  }
}

// ─── 1. Dependencias (npm audit) ───────────────────────────────────────────
function parseNpmAuditJson(extraArgs = '') {
  const cmd = `npm audit --json ${extraArgs}`.trim()
  try {
    const raw = execSync(cmd, {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 12 * 1024 * 1024,
    })
    return JSON.parse(raw)
  } catch (err) {
    const out =
      typeof err.stdout === 'string'
        ? err.stdout
        : err.stdout != null
          ? String(err.stdout)
          : ''
    if (out.trim()) {
      try {
        return JSON.parse(out)
      } catch {
        return null
      }
    }
    return null
  }
}

function checkNpmAudit() {
  // Umbral FAIL: solo dependencias de producción (lo que afecta al bundle desplegado).
  // Las devDependencies (p. ej. firebase-tools en CI) pueden avisarse aparte.
  const prod = parseNpmAuditJson('--omit=dev')
  if (!prod?.metadata?.vulnerabilities) {
    add('deps-npm-audit', 'WARN', 'no se obtuvo JSON de npm audit --omit=dev')
    return
  }
  const m = prod.metadata.vulnerabilities
  const critical = m.critical ?? 0
  const high = m.high ?? 0
  const moderate = m.moderate ?? 0
  const summary = `producción: critical=${critical}, high=${high}, moderate=${moderate}`
  if (critical > 0 || high > 0) {
    add('deps-npm-audit', WARN_ONLY ? 'WARN' : 'FAIL', summary)
  } else if (moderate > 0) {
    add('deps-npm-audit', 'WARN', `${summary} (revisar moderadas)`)
  } else {
    add('deps-npm-audit', 'PASS', summary)
  }

  const all = parseNpmAuditJson('')
  if (all?.metadata?.vulnerabilities) {
    const d = all.metadata.vulnerabilities
    const dh = (d.high ?? 0) + (d.critical ?? 0)
    if (dh > critical + high && dh > 0) {
      add(
        'deps-npm-audit-dev',
        'WARN',
        `devDependencies: critical=${d.critical ?? 0}, high=${d.high ?? 0} (revisar; no bloquea CI)`,
      )
    }
  }
}

// ─── 2. Patrones peligrosos en frontend (src/) ───────────────────────────────
const DANGEROUS_PATTERNS = [
  { name: 'dangerouslySetInnerHTML', re: /dangerouslySetInnerHTML/ },
  { name: 'eval(', re: /\beval\s*\(/ },
  { name: 'new Function(', re: /new\s+Function\s*\(/ },
  { name: 'javascript: URL', re: /javascript\s*:/i },
]

function checkDangerousFrontendPatterns() {
  const files = gitLsFiles()?.filter((p) => /\.(tsx|ts|jsx|js)$/.test(p) && p.startsWith('src/')) ?? []
  if (files.length === 0) {
    add('frontend-dangerous-patterns', 'SKIP', 'sin git ls-files o sin archivos src/')
    return
  }
  const hits = []
  for (const f of files) {
    const full = join(root, f)
    if (!existsSync(full)) continue
    let content
    try {
      content = readFileSync(full, 'utf8')
    } catch {
      continue
    }
    for (const { name, re } of DANGEROUS_PATTERNS) {
      if (re.test(content)) hits.push(`${f} (${name})`)
    }
  }
  if (hits.length) add('frontend-dangerous-patterns', 'FAIL', hits.join('; '))
  else add('frontend-dangerous-patterns', 'PASS', 'sin patrones de alto riesgo en src/')
}

// ─── 3. Posibles secretos en archivos versionados ───────────────────────────
const SECRET_PATTERNS = [
  { label: 'Google API key (AIza...)', re: /AIza[0-9A-Za-z_-]{30,}/ },
  { label: 'Clave privada PEM', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { label: 'Stripe secret live', re: /sk_live_[0-9a-zA-Z]{20,}/ },
]

function checkLeakedSecrets() {
  const files = gitLsFiles()
  if (!files?.length) {
    add('secrets-in-tracked-files', 'SKIP', 'git ls-files no disponible')
    return
  }
  const bad = []
  for (const f of files) {
    if (f.endsWith('package-lock.json') || f.endsWith('security-audit-extended.mjs')) continue
    const full = join(root, f)
    if (!existsSync(full)) continue
    let text
    try {
      text = readFileSync(full, 'utf8')
    } catch {
      continue
    }
    for (const { label, re } of SECRET_PATTERNS) {
      if (re.test(text)) bad.push(`${f}: posible ${label}`)
    }
  }
  if (bad.length) add('secrets-in-tracked-files', 'FAIL', bad.join('; '))
  else add('secrets-in-tracked-files', 'PASS', 'sin coincidencias obvias en archivos trackeados')
}

// ─── 4. Cloud Functions: auth y helpers de rol (análisis estático) ─────────
function checkCloudFunctionsStatic() {
  const fnIndex = join(root, 'functions/src/index.ts')
  if (!existsSync(fnIndex)) {
    add('functions-auth-static', 'SKIP', 'functions/src/index.ts no encontrado')
    return
  }
  const code = readFileSync(fnIndex, 'utf8')
  const issues = []
  if (!code.includes('if (!context.auth)')) issues.push('revisar presencia de guard auth en handlers')
  if (!code.includes('requireStaffOrAdmin') && !code.includes('requireAdmin')) issues.push('helpers de rol no encontrados')
  const onCallBlocks = code.split(/export const \w+ = regionalFunctions\.https\.onCall/)
  if (onCallBlocks.length < 2) issues.push('pocos handlers onCall detectados')
  if (issues.length) add('functions-auth-static', 'WARN', issues.join(' | '))
  else add('functions-auth-static', 'PASS', 'presencia de auth y require* en index.ts')
}

// ─── 5. HTTPS y cabeceras (HEAD opcional) ───────────────────────────────────
async function checkHeadersAndHttps() {
  if (!AUDIT_URL) {
    add('https-security-headers', 'SKIP', 'define SECURITY_AUDIT_URL (ej. https://app-mascotas-2026.vercel.app)')
    return
  }
  try {
    const u = new URL(AUDIT_URL)
    if (u.protocol !== 'https:') {
      add('https-security-headers', 'FAIL', 'la URL debe ser https://')
      return
    }
    const res = await fetch(AUDIT_URL, { method: 'HEAD', redirect: 'follow' })
    const hsts = res.headers.get('strict-transport-security')
    const csp = res.headers.get('content-security-policy')
    const xcto = res.headers.get('x-content-type-options')
    const parts = [`HTTP ${res.status}`]
    if (hsts) parts.push('HSTS presente')
    else parts.push('HSTS ausente')
    if (csp) parts.push('CSP presente')
    else parts.push('CSP ausente (común en SPAs sin cabecera en CDN)')
    if (xcto) parts.push('X-Content-Type-Options presente')
    const warn = !hsts || !csp
    add('https-security-headers', warn ? 'WARN' : 'PASS', parts.join('; '))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    add('https-security-headers', 'FAIL', `fetch: ${msg}`)
  }
}

// ─── 6. .env en historial git (heurística) ─────────────────────────────────
function checkEnvInGitHistory() {
  try {
    const tracked = execSync('git ls-files --error-unmatch .env 2>/dev/null', { cwd: root, encoding: 'utf8' })
    if (tracked.trim()) {
      add('git-env-tracked', 'FAIL', '.env está trackeado por git — no subas secretos al repo')
      return
    }
  } catch {
    /* no trackeado */
  }
  try {
    const log = execSync('git log -1 --oneline -- .env 2>/dev/null', { cwd: root, encoding: 'utf8' }).trim()
    if (log) {
      add('git-env-history', 'WARN', `.env apareció en historial: ${log} — revisar que no haya secretos`)
    } else {
      add('git-env-history', 'PASS', 'sin commits recientes que toquen .env (heurística)')
    }
  } catch {
    add('git-env-history', 'SKIP', 'no se pudo consultar git log')
  }
}

// ─── 7. Manual / no automatizable ───────────────────────────────────────────
function printManual() {
  add('auth-brute-force', 'MANUAL', 'rate limit en Auth/Firebase Console; CAPTCHA si aplica')
  add('auth-stolen-tokens', 'MANUAL', 'revocar sesiones, MFA, reglas mínimas en cliente')
  add('business-spam-forms', 'MANUAL', 'límites en CF, honeypot, validación server-side (adopción ya va por CF)')
  add('cf-runtime-validation', 'MANUAL', 'tests de integración con emulador + tokens de prueba (otro suite)')
}

function printReport() {
  console.log('\n=== Auditoría extendida (segundo nivel) ===\n')
  const order = { FAIL: 0, WARN: 1, SKIP: 2, MANUAL: 3, PASS: 4 }
  for (const r of rows.sort((a, b) => order[a.status] - order[b.status])) {
    const tag = `[${r.status}]`.padEnd(8)
    console.log(`${tag} ${r.id}`)
    if (r.detail) console.log(`         ${r.detail}`)
  }
  const fail = rows.filter((r) => r.status === 'FAIL').length
  const warn = rows.filter((r) => r.status === 'WARN').length
  console.log(`\nResumen: ${rows.filter((r) => r.status === 'PASS').length} PASS, ${warn} WARN, ${fail} FAIL, ${rows.filter((r) => r.status === 'SKIP').length} SKIP, ${rows.filter((r) => r.status === 'MANUAL').length} MANUAL\n`)
  if (fail > 0 && !WARN_ONLY) process.exitCode = 1
  else if (fail > 0 && WARN_ONLY) process.exitCode = 0
}

async function main() {
  checkNpmAudit()
  checkDangerousFrontendPatterns()
  checkLeakedSecrets()
  checkCloudFunctionsStatic()
  await checkHeadersAndHttps()
  checkEnvInGitHistory()
  printManual()
  printReport()
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
