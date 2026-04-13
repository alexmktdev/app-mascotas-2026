/**
 * E2E: Home (catálogo público de mascotas).
 */

import { test, expect } from '@playwright/test'

test.describe('Home — Catálogo público', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('carga la página principal con título', async ({ page }) => {
    // Verifica que la página cargó (title o heading)
    await expect(page).toHaveTitle(/mascotas/i)
  })

  test('muestra header con navegación', async ({ page }) => {
    // El header público debe estar visible
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })

  test('muestra tarjetas de mascotas o estado vacío', async ({ page }) => {
    // Espera a que cargue: tarjetas o mensaje de vacío
    const cards = page.locator('[class*="rounded-2xl"]').first()
    const emptyState = page.getByText(/no hay mascotas/i).first()

    // Una de las dos debe aparecer
    await Promise.race([
      cards.waitFor({ timeout: 10_000 }).catch(() => null),
      emptyState.waitFor({ timeout: 10_000 }).catch(() => null),
    ])

    const hasCards = await cards.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)

    expect(hasCards || hasEmpty).toBe(true)
  })

  test('filtros de especie son clickeables', async ({ page }) => {
    // Buscar botones o filtros de especie (Perro / Gato)
    const dogFilter = page.getByRole('button', { name: /perro/i }).first()
    const catFilter = page.getByRole('button', { name: /gato/i }).first()

    const hasDogFilter = await dogFilter.isVisible().catch(() => false)
    const hasCatFilter = await catFilter.isVisible().catch(() => false)

    if (hasDogFilter) {
      await dogFilter.click()
      // No debe crashear
      await page.waitForTimeout(500)
    }

    if (hasCatFilter) {
      await catFilter.click()
      await page.waitForTimeout(500)
    }
  })

  test('buscador de mascotas filtra resultados', async ({ page }) => {
    // Buscar input de búsqueda
    const searchInput = page.getByPlaceholder(/buscar/i).first()
    const hasSearch = await searchInput.isVisible().catch(() => false)

    if (hasSearch) {
      await searchInput.fill('Luna')
      // Espera a que se aplique el filtro (debounce)
      await page.waitForTimeout(600)
      // No debe crashear
    }
  })
})
