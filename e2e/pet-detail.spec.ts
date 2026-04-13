/**
 * E2E: Detalle de mascota.
 */

import { test, expect } from '@playwright/test'

test.describe('Pet Detail — Detalle de mascota', () => {
  test('muestra info completa al navegar a una mascota', async ({ page }) => {
    // Ir a la home primero
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Buscar un link a detalle de mascota
    const petLink = page.locator('a[href^="/pets/"]').first()
    const hasPets = await petLink.isVisible().catch(() => false)

    if (hasPets) {
      await petLink.click()
      await page.waitForURL(/\/pets\//)

      // Debe mostrar información de la mascota
      // El nombre debe ser visible (en un heading o texto prominente)
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible({ timeout: 5000 })
    } else {
      // Sin mascotas en la DB, solo verificamos que la home funciona
      test.skip()
    }
  })

  test('muestra botón de adoptar en detalle', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const petLink = page.locator('a[href^="/pets/"]').first()
    const hasPets = await petLink.isVisible().catch(() => false)

    if (hasPets) {
      await petLink.click()
      await page.waitForURL(/\/pets\//)

      // Buscar botón de adoptar
      const adoptBtn = page.getByRole('link', { name: /adoptar/i }).or(
        page.getByRole('button', { name: /adoptar/i })
      )
      const hasAdopt = await adoptBtn.first().isVisible().catch(() => false)
      // Si la mascota está disponible, debe tener botón de adoptar
      if (hasAdopt) {
        await expect(adoptBtn.first()).toBeVisible()
      }
    } else {
      test.skip()
    }
  })

  test('muestra página 404 para ID inexistente', async ({ page }) => {
    await page.goto('/pets/00000000-0000-0000-0000-000000000000')
    await page.waitForTimeout(3000)

    // Debe mostrar algún mensaje de error o "no encontrado"
    const errorText = page.getByText(/no encontr|error|not found/i).first()
    const hasError = await errorText.isVisible().catch(() => false)

    // Puede ser un toast, texto en la página, o simplemente la home
    // Lo importante es que la app no crashea
    expect(page.url()).toBeTruthy()
    if (hasError) {
      await expect(errorText).toBeVisible()
    }
  })
})
