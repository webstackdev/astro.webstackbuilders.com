/**
 * GDPR Consent Banner Tests
 * @see src/components/Consent/
 */

import { BasePage, test, expect } from '@test/e2e/helpers'


test.describe('GDPR Consent Component', () => {
  /**
   * Setup for GDPR consent component tests
   *
   * Side effects relied upon:
   * - Navigates to the contact page which contains a newsletter signup form
   *
   * Without this setup, tests would fail due to:
   * - GDPR consent checkbox not being present on the page
   * - Newsletter form and associated consent controls not being rendered
   *
   * The contact page is specifically chosen because it contains the newsletter
   * subscription form which includes GDPR consent controls
   */
  test.beforeEach(async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
  })

  test.skip('@wip GDPR consent checkbox is visible', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: GDPR consent checkbox should be visible on newsletter form
    const gdprCheckbox = page.locator('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]')
    await expect(gdprCheckbox.first()).toBeVisible()
  })

  test.skip('@wip GDPR consent has label', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
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

  test.skip('@wip GDPR label contains privacy policy link', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: GDPR label should link to privacy policy
    const gdprLabel = page.locator('label:has(input[type="checkbox"][name*="consent"]), label:has(input[type="checkbox"][name*="gdpr"])').first()
    const privacyLink = gdprLabel.locator('a[href*="privacy"]')

    await expect(privacyLink).toBeVisible()
  })

  test.skip('@wip privacy policy link opens in new tab', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Privacy link should have target="_blank"
    const gdprLabel = page.locator('label:has(input[type="checkbox"][name*="consent"]), label:has(input[type="checkbox"][name*="gdpr"])').first()
    const privacyLink = gdprLabel.locator('a[href*="privacy"]')

    const target = await privacyLink.getAttribute('target')
    expect(target).toBe('_blank')

    const rel = await privacyLink.getAttribute('rel')
    expect(rel).toContain('noopener')
  })

  test.skip('@wip form cannot submit without GDPR consent', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Form submission should fail if GDPR not checked
    const emailInput = page.locator('input[type="email"]').first()
    const submitButton = page.locator('button[type="submit"]').first()
    const gdprCheckbox = page.locator('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]').first()

    await emailInput.fill('test@example.com')
    // Don't check GDPR

    await submitButton.click()
    await expect.poll(async () => {
      return await gdprCheckbox.evaluate((el: HTMLInputElement) => el.validationMessage)
    }).not.toEqual('')
  })

  test.skip('@wip form can submit with GDPR consent', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Form should accept submission when GDPR is checked
    const emailInput = page.locator('input[type="email"]').first()
    const submitButton = page.locator('button[type="submit"]').first()
    const gdprCheckbox = page.locator('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]').first()

    await emailInput.fill('test@example.com')
    await gdprCheckbox.check()

    await submitButton.click()

    // Form should be processing or show success
    // (Actual behavior depends on API implementation)
  })

  test.skip('@wip GDPR checkbox is accessible via keyboard', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Can check/uncheck with Space key
    const gdprCheckbox = page.locator('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]').first()

    // Tab to checkbox
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab') // May need multiple tabs

    // Check with Space
    await page.keyboard.press('Space')
    await expect(gdprCheckbox).toBeChecked()
  })

  test.skip('@wip GDPR error message is displayed', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Should show error message when unchecked on submit
    const submitButton = page.locator('button[type="submit"]').first()
    const emailInput = page.locator('input[type="email"]').first()

    await emailInput.fill('test@example.com')
    await submitButton.click()
    const errorMessage = page.locator('[data-error*="consent"], [data-error*="gdpr"], .error:has-text("consent")')
    await expect(errorMessage.first()).toBeVisible()
  })

  test.skip('@wip GDPR checkbox works on contact form', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: GDPR should also work on contact form
    await page.goto('/contact')

    const gdprCheckbox = page.locator('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]')
    await expect(gdprCheckbox.first()).toBeVisible()

    const label = gdprCheckbox.first().locator('xpath=..').locator('..')
    const labelText = await label.textContent()
    expect(labelText?.toLowerCase()).toContain('privacy')
  })

  test.skip('@wip GDPR consent state persists during form validation', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: If user checks GDPR then triggers other validation, GDPR stays checked
    const gdprCheckbox = page.locator('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="gdpr"]').first()
    const submitButton = page.locator('button[type="submit"]').first()

    // Check GDPR first
    await gdprCheckbox.check()
    expect(await gdprCheckbox.isChecked()).toBe(true)

    // Submit form (may trigger other validation)
    await submitButton.click()
    await expect(gdprCheckbox).toBeChecked()
  })
})
