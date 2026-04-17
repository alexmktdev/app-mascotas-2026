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

    await page.getByRole('button', { name: /^Ingresar$/i }).click()

    // Mensaje de error en pantalla (Login.tsx setServerError)
    await expect(page.getByText(/credenciales inválidas/i)).toBeVisible({ timeout: 15_000 })
    expect(page.url()).toContain('/login')
  })

  test('página de login tiene validación de formulario', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: /^Ingresar$/i }).click()

    // Zod + RHF: ambos campos vacíos muestran errores (cualquiera basta para el test)
    await expect(page.getByText('El correo es obligatorio')).toBeVisible({ timeout: 5000 })
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
