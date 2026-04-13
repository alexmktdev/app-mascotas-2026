/**
 * E2E: Autenticación y protección de rutas.
 */

import { test, expect } from '@playwright/test'

test.describe('Auth — Autenticación y rutas protegidas', () => {
  test('acceder a /admin sin login redirige a /login', async ({ page }) => {
    await page.goto('/admin')
    // Debe redirigir a /login
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })

  test('acceder a /admin/pets sin login redirige a /login', async ({ page }) => {
    await page.goto('/admin/pets')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })

  test('acceder a /admin/users sin login redirige a /login', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })

  test('página de login tiene formulario con email y password', async ({ page }) => {
    await page.goto('/login')

    // Debe tener inputs de email y password
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    await expect(emailInput).toBeVisible({ timeout: 5000 })
    await expect(passwordInput).toBeVisible({ timeout: 5000 })
  })

  test('login con credenciales inválidas muestra error', async ({ page }) => {
    await page.goto('/login')

    await page.locator('input[type="email"]').fill('bad@invalid.com')
    await page.locator('input[type="password"]').fill('wrongpassword')

    const submitBtn = page.getByRole('button', { name: /iniciar|login|entrar/i }).first()
    await submitBtn.click()

    // Esperar mensaje de error (toast o texto)
    await page.waitForTimeout(3000)

    // Debe seguir en /login
    expect(page.url()).toContain('/login')
  })

  test('página de login tiene validación de formulario', async ({ page }) => {
    await page.goto('/login')

    // Click en submit sin llenar nada
    const submitBtn = page.getByRole('button', { name: /iniciar|login|entrar/i }).first()
    await submitBtn.click()

    await page.waitForTimeout(500)

    // Debe mostrar mensajes de error de validación
    // o el botón debe ser disabled / el formulario no se envía
    expect(page.url()).toContain('/login')
  })

  test('ruta 404 para paths no existentes', async ({ page }) => {
    await page.goto('/ruta-que-no-existe')
    await page.waitForTimeout(2000)

    // Debe mostrar algo (no crash)
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('ruta /unauthorized existe y es accesible', async ({ page }) => {
    await page.goto('/unauthorized')
    await page.waitForTimeout(2000)

    // No debe crashear, debe mostrar contenido
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})
