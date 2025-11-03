/**
 * GDPR Consent Component Tests
 * Tests for GDPR consent checkboxes in forms
 * @see src/components/Cookies/
 */

import { test, expect } from '@test/e2e/helpers'


test.describe('GDPR Consent Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact') // Use contact page which has newsletter form
  })

  test.skip('@wip GDPR consent checkbox is visible', async ({ page }) => {
    // Expected: GDPR consent checkbox should be visible on newsletter form
    const gdprCheckbox = page.locator('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]')
    await expect(gdprCheckbox.first()).toBeVisible()
  })

  test.skip('@wip GDPR consent has label', async ({ page }) => {
    // Expected: Checkbox should have associated label
    const gdprCheckbox = page.locator('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]').first()
    const checkboxId = await gdprCheckbox.getAttribute('id')

    if (checkboxId) {
      const label = page.locator(`label[for="${checkboxId}"]`)
      await expect(label).toBeVisible()
    } else {
      // Label might wrap checkbox
      const parentLabel = gdprCheckbox.locator('..')
      const labelText = await parentLabel.textContent()
      expect(labelText?.trim().length).toBeGreaterThan(0)
    }
  })

  test.skip('@wip GDPR label contains privacy policy link', async ({ page }) => {
    // Expected: GDPR label should link to privacy policy
    const gdprLabel = page.locator('label:has(input[type="checkbox"][name*="consent"]), label:has(input[type="checkbox"][name*="gdpr"])').first()
    const privacyLink = gdprLabel.locator('a[href*="privacy"]')

    await expect(privacyLink).toBeVisible()
  })

  test.skip('@wip privacy policy link opens in new tab', async ({ page }) => {
    // Expected: Privacy link should have target="_blank"
    const gdprLabel = page.locator('label:has(input[type="checkbox"][name*="consent"]), label:has(input[type="checkbox"][name*="gdpr"])').first()
    const privacyLink = gdprLabel.locator('a[href*="privacy"]')

    const target = await privacyLink.getAttribute('target')
    expect(target).toBe('_blank')

    const rel = await privacyLink.getAttribute('rel')
    expect(rel).toContain('noopener')
  })

  test.skip('@wip form cannot submit without GDPR consent', async ({ page }) => {
    // Expected: Form submission should fail if GDPR not checked
    const emailInput = page.locator('input[type="email"]').first()
    const submitButton = page.locator('button[type="submit"]').first()
    const gdprCheckbox = page.locator('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]').first()

    await emailInput.fill('test@example.com')
    // Don't check GDPR

    await submitButton.click()
    await page.waitForTimeout(500)

    // Should show validation error
    const validationMessage = await gdprCheckbox.evaluate((el: HTMLInputElement) => el.validationMessage)
    expect(validationMessage).toBeTruthy()
  })

  test.skip('@wip form can submit with GDPR consent', async ({ page }) => {
    // Expected: Form should accept submission when GDPR is checked
    const emailInput = page.locator('input[type="email"]').first()
    const submitButton = page.locator('button[type="submit"]').first()
    const gdprCheckbox = page.locator('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]').first()

    await emailInput.fill('test@example.com')
    await gdprCheckbox.check()

    await submitButton.click()
    await page.waitForTimeout(1000)

    // Form should be processing or show success
    // (Actual behavior depends on API implementation)
  })

  test.skip('@wip GDPR checkbox is accessible via keyboard', async ({ page }) => {
    // Expected: Can check/uncheck with Space key
    const gdprCheckbox = page.locator('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]').first()

    // Tab to checkbox
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab') // May need multiple tabs

    // Check with Space
    await page.keyboard.press('Space')
    await page.waitForTimeout(300)

    const isChecked = await gdprCheckbox.isChecked()
    expect(isChecked).toBe(true)
  })

  test.skip('@wip GDPR error message is displayed', async ({ page }) => {
    // Expected: Should show error message when unchecked on submit
    const submitButton = page.locator('button[type="submit"]').first()
    const emailInput = page.locator('input[type="email"]').first()

    await emailInput.fill('test@example.com')
    await submitButton.click()
    await page.waitForTimeout(500)

    // Look for error message
    const errorMessage = page.locator('[data-error*="consent"], [data-error*="gdpr"], .error:has-text("consent")')
    await expect(errorMessage.first()).toBeVisible()
  })

  test.skip('@wip GDPR checkbox works on contact form', async ({ page }) => {
    // Expected: GDPR should also work on contact form
    await page.goto('/contact')

    const gdprCheckbox = page.locator('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]')
    await expect(gdprCheckbox.first()).toBeVisible()

    const label = gdprCheckbox.first().locator('xpath=..').locator('..')
    const labelText = await label.textContent()
    expect(labelText?.toLowerCase()).toContain('privacy')
  })

  test.skip('@wip GDPR consent state persists during form validation', async ({ page }) => {
    // Expected: If user checks GDPR then triggers other validation, GDPR stays checked
    const gdprCheckbox = page.locator('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]').first()
    const submitButton = page.locator('button[type="submit"]').first()

    // Check GDPR first
    await gdprCheckbox.check()
    expect(await gdprCheckbox.isChecked()).toBe(true)

    // Submit form (may trigger other validation)
    await submitButton.click()
    await page.waitForTimeout(500)

    // GDPR should still be checked
    expect(await gdprCheckbox.isChecked()).toBe(true)
  })
})
