#!/usr/bin/env node
/**
 * Smoke E2E: recorre rutas y prueba clic en botones/enlaces visibles.
 *
 * Modo seguro (default):
 * - No ejecuta acciones mutantes (crear/guardar/eliminar/aprobar/rechazar).
 * - Si aparece confirmación nativa o modal, intenta cancelar.
 *
 * Variables:
 * - BASE_URL=http://localhost:5173
 * - ADMIN_EMAIL=admin@demo.cl
 * - ADMIN_PASSWORD=*****
 * - SMOKE_ALLOW_MUTATIONS=true   // opcional (peligroso)
 */

import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''
const ALLOW_MUTATIONS = process.env.SMOKE_ALLOW_MUTATIONS === 'true'

const ROUTES_PUBLIC = ['/', '/login']
const ROUTES_ADMIN = [
  '/admin',
  '/admin/pets',
  '/admin/pets/new',
  '/admin/in-process',
  '/admin/adopted',
  '/admin/users',
  '/admin/users/new',
]

const MAX_CLICKS_PER_ROUTE = 120
const PAUSE_MS = 250

const destructivePattern =
  /\b(guardar|crear|eliminar|aprobar|rechazar|confirmar|ingresar|actualizar|enviar)\b/i
const unsafeNavPattern = /\b(cerrar sesi[oó]n|salir)\b/i

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cleanText(s) {
  return (s ?? '').replace(/\s+/g, ' ').trim()
}

async function tryDismissAppConfirm(page) {
  const cancel = page.getByRole('button', { name: /cancelar|cerrar|no/i }).first()
  if (await cancel.isVisible().catch(() => false)) {
    await cancel.click({ timeout: 1500 }).catch(() => {})
  }
}

async function loginIfNeeded(page) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn('SMOKE: sin ADMIN_EMAIL/ADMIN_PASSWORD, se omiten rutas admin.')
    return false
  }

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.locator('input[type="email"]').first().fill(ADMIN_EMAIL)
  await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /ingresar/i }).click()

  try {
    // Login exitoso esperado
    await page.waitForURL(/\/admin/, { timeout: 12000 })
    return true
  } catch {
    // Si no entra, probablemente credenciales inválidas o backend no disponible.
    // No abortamos el smoke completo; solo omitimos rutas admin.
    const loginError = page
      .locator('text=/credenciales inválidas|error de conexión|no autorizado/i')
      .first()
    const hasUiError = await loginError.isVisible().catch(() => false)
    const currentPath = new URL(page.url()).pathname

    console.warn(
      `SMOKE: no se pudo iniciar sesión admin (ruta actual: ${currentPath}). ${
        hasUiError ? 'La UI mostró error de autenticación.' : 'Sin mensaje visible en UI.'
      } Se omiten rutas admin.`,
    )
    return false
  }
}

async function clickThroughRoute(page, route, report) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' })
  await sleep(PAUSE_MS)

  const loc = page.locator('button, a, [role="button"], input[type="submit"]')
  const total = await loc.count()

  let skippedInvisible = 0
  let skippedDisabled = 0
  let skippedUnsafe = 0
  let skippedMutating = 0
  let clicked = 0

  for (let i = 0; i < total && clicked < MAX_CLICKS_PER_ROUTE; i++) {
    const el = loc.nth(i)
    const visible = await el.isVisible().catch(() => false)
    if (!visible) {
      skippedInvisible += 1
      continue
    }

    const disabled = await el.isDisabled().catch(() => false)
    if (disabled) {
      skippedDisabled += 1
      continue
    }

    const text = cleanText(await el.innerText().catch(() => ''))
    const title = cleanText((await el.getAttribute('title').catch(() => '')) ?? '')
    const aria = cleanText((await el.getAttribute('aria-label').catch(() => '')) ?? '')
    const kind = cleanText(await el.evaluate((n) => n.tagName.toLowerCase()).catch(() => ''))
    const fingerprint = `${kind}|${text}|${title}|${aria}|idx:${i}`

    const semantic = cleanText(`${text} ${title} ${aria}`)
    if (unsafeNavPattern.test(semantic)) {
      skippedUnsafe += 1
      continue
    }
    if (!ALLOW_MUTATIONS && destructivePattern.test(semantic)) {
      skippedMutating += 1
      continue
    }

    try {
      const href = await el.getAttribute('href').catch(() => null)
      await el.click({ timeout: 2500 })
      clicked += 1
      report.push({ route, action: semantic || fingerprint, ok: true })
      await sleep(PAUSE_MS)

      await tryDismissAppConfirm(page)

      // Si navegó a otra ruta de la app, volvemos al contexto de la ruta probada.
      const current = new URL(page.url()).pathname
      if (current !== route) {
        if (href && href.startsWith('http')) {
          // externo, no forzar retorno
        } else {
          await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' })
          await sleep(PAUSE_MS)
        }
      }
    } catch (err) {
      report.push({
        route,
        action: semantic || fingerprint,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      })
      // Recuperación básica para continuar test
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' }).catch(() => {})
      await sleep(PAUSE_MS)
    }
  }

  console.log(
    `SMOKE [${route}] total:${total} clicked:${clicked} skip(disabled:${skippedDisabled}, unsafe:${skippedUnsafe}, mutating:${skippedMutating}, invisible:${skippedInvisible})`,
  )
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  const report = []

  page.on('dialog', async (dialog) => {
    try {
      await dialog.dismiss()
    } catch {
      // noop
    }
  })

  try {
    for (const route of ROUTES_PUBLIC) {
      await clickThroughRoute(page, route, report)
    }

    const hasAdminSession = await loginIfNeeded(page)
    if (hasAdminSession) {
      for (const route of ROUTES_ADMIN) {
        await clickThroughRoute(page, route, report)
      }
    }

    const failed = report.filter((r) => !r.ok)
    const ok = report.filter((r) => r.ok)

    console.log(`SMOKE BOTONES: ${ok.length} OK, ${failed.length} FAIL`)
    if (failed.length > 0) {
      console.log('--- Fallos ---')
      for (const f of failed) {
        console.log(`[${f.route}] ${f.action} -> ${f.error}`)
      }
      process.exitCode = 1
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('SMOKE BOTONES ERROR:', err)
  process.exit(1)
})
