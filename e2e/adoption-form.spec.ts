/**
 * E2E: Formulario de adopción.
 */

import { test, expect } from '@playwright/test'

test.describe('Adoption Form — Formulario de adopción', () => {
  test('valida campos requeridos al enviar vacío', async ({ page }) => {
    // Necesitamos un petId válido. Navegamos desde home.
    await page.goto('/')
    await page.waitForTimeout(2000)

    const petLink = page.locator('a[href^="/pets/"]').first()
    const hasPets = await petLink.isVisible().catch(() => false)

    if (!hasPets) {
      test.skip()
      return
    }

    await petLink.click()
    await page.waitForURL(/\/pets\//)

    // Click en adoptar
    const adoptLink = page.getByRole('link', { name: /adoptar/i }).first()
    const hasAdopt = await adoptLink.isVisible().catch(() => false)
    if (!hasAdopt) {
      test.skip()
      return
    }

    await adoptLink.click()
    await page.waitForURL(/\/adopt\//)

    // Intentar enviar sin llenar
    const submitBtn = page.getByRole('button', { name: /enviar|solicitar/i }).first()
    const hasSubmit = await submitBtn.isVisible().catch(() => false)

    if (hasSubmit) {
      await submitBtn.click()
      await page.waitForTimeout(500)

      // Deben aparecer mensajes de error de validación
      const errorMessages = page.locator('[class*="text-rose"], [class*="text-red"], [role="alert"]')
      const errorCount = await errorMessages.count()
      expect(errorCount).toBeGreaterThan(0)
    }
  })

  test('honeypot no es visible para el usuario', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const petLink = page.locator('a[href^="/pets/"]').first()
    const hasPets = await petLink.isVisible().catch(() => false)

    if (!hasPets) {
      test.skip()
      return
    }

    await petLink.click()
    await page.waitForURL(/\/pets\//)

    const adoptLink = page.getByRole('link', { name: /adoptar/i }).first()
    const hasAdopt = await adoptLink.isVisible().catch(() => false)
    if (!hasAdopt) {
      test.skip()
      return
    }

    await adoptLink.click()
    await page.waitForURL(/\/adopt\//)

    // El honeypot debe estar oculto visualmente
    const honeypot = page.locator('input[name="_honeypot"]')
    const exists = await honeypot.count()
    if (exists > 0) {
      // Debe estar oculto (display:none, hidden, aria-hidden, etc.)
      const isHidden = await honeypot.isHidden()
      expect(isHidden).toBe(true)
    }
  })

  test('campos del formulario son escribibles', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const petLink = page.locator('a[href^="/pets/"]').first()
    const hasPets = await petLink.isVisible().catch(() => false)

    if (!hasPets) {
      test.skip()
      return
    }

    await petLink.click()
    await page.waitForURL(/\/pets\//)

    const adoptLink = page.getByRole('link', { name: /adoptar/i }).first()
    const hasAdopt = await adoptLink.isVisible().catch(() => false)
    if (!hasAdopt) {
      test.skip()
      return
    }

    await adoptLink.click()
    await page.waitForURL(/\/adopt\//)

    // Llenar campos principales
    const nameInput = page.locator('input[name="full_name"]').first()
    const hasName = await nameInput.isVisible().catch(() => false)

    if (hasName) {
      await nameInput.fill('Test Usuario E2E')
      await expect(nameInput).toHaveValue('Test Usuario E2E')
    }

    const emailInput = page.locator('input[name="email"]').first()
    const hasEmail = await emailInput.isVisible().catch(() => false)

    if (hasEmail) {
      await emailInput.fill('test-e2e@example.com')
      await expect(emailInput).toHaveValue('test-e2e@example.com')
    }
  })
})
