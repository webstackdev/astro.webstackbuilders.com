/**
 * Cookie Consent Banner Tests
 * Tests for cookie consent banner display and functionality
 * @see src/components/Cookies/
 */

import { test, expect } from '@test/e2e/helpers'


test.describe('Cookie Consent Banner', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and storage before each test
    await context.clearCookies()
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()
  })

  test.skip('@wip cookie banner displays on first visit', async ({ page }) => {
    // Expected: Cookie consent banner should appear for first-time visitors
    const cookieBanner = page.locator('[data-cookie-banner]')
    await expect(cookieBanner).toBeVisible()
  })

  test.skip('@wip cookie banner has accept button', async ({ page }) => {
    // Expected: Banner should have "Accept" button
    const cookieBanner = page.locator('[data-cookie-banner]')
    const acceptButton = cookieBanner.locator('[data-cookie-accept], button:has-text("Accept")')

    await expect(acceptButton.first()).toBeVisible()
  })

  test.skip('@wip cookie banner has reject/decline button', async ({ page }) => {
    // Expected: Banner should have "Decline" or "Reject" option
    const cookieBanner = page.locator('[data-cookie-banner]')
    const rejectButton = cookieBanner.locator('[data-cookie-reject], button:has-text("Decline"), button:has-text("Reject")')

    await expect(rejectButton.first()).toBeVisible()
  })

  test.skip('@wip cookie banner has preferences/settings button', async ({ page }) => {
    // Expected: Banner should allow managing preferences
    const cookieBanner = page.locator('[data-cookie-banner]')
    const settingsButton = cookieBanner.locator(
      '[data-cookie-settings], button:has-text("Settings"), button:has-text("Preferences"), button:has-text("Manage")'
    )

    await expect(settingsButton.first()).toBeVisible()
  })

  test.skip('@wip clicking accept hides banner', async ({ page }) => {
    // Expected: Banner should disappear after accepting
    const cookieBanner = page.locator('[data-cookie-banner]')
    const acceptButton = cookieBanner.locator('[data-cookie-accept], button:has-text("Accept")').first()

    await acceptButton.click()
    await page.waitForTimeout(500)

    await expect(cookieBanner).not.toBeVisible()
  })

  test.skip('@wip clicking decline hides banner', async ({ page }) => {
    // Expected: Banner should disappear after declining
    const cookieBanner = page.locator('[data-cookie-banner]')
    const rejectButton = cookieBanner.locator('[data-cookie-reject], button:has-text("Decline")').first()

    await rejectButton.click()
    await page.waitForTimeout(500)

    await expect(cookieBanner).not.toBeVisible()
  })

  test.skip('@wip accept choice persists across page reloads', async ({ page }) => {
    // Expected: After accepting, banner should not reappear
    const cookieBanner = page.locator('[data-cookie-banner]')
    const acceptButton = cookieBanner.locator('[data-cookie-accept], button:has-text("Accept")').first()

    await acceptButton.click()
    await page.waitForTimeout(500)

    await page.reload()
    await page.waitForTimeout(500)

    await expect(cookieBanner).not.toBeVisible()
  })

  test.skip('@wip accept choice persists across navigation', async ({ page }) => {
    // Expected: After accepting, banner should not appear on other pages
    const cookieBanner = page.locator('[data-cookie-banner]')
    const acceptButton = cookieBanner.locator('[data-cookie-accept], button:has-text("Accept")').first()

    await acceptButton.click()
    await page.waitForTimeout(500)

    await page.goto('/about')
    await page.waitForTimeout(500)

    await expect(cookieBanner).not.toBeVisible()
  })

  test.skip('@wip banner contains privacy policy link', async ({ page }) => {
    // Expected: Banner should link to privacy/cookie policy
    const cookieBanner = page.locator('[data-cookie-banner]')
    const policyLink = cookieBanner.locator('a[href*="privacy"], a[href*="cookie"]')

    await expect(policyLink.first()).toBeVisible()
  })

  test.skip('@wip cookie preferences modal opens', async ({ page }) => {
    // Expected: Settings button should open preferences modal
    const cookieBanner = page.locator('[data-cookie-banner]')
    const settingsButton = cookieBanner.locator('[data-cookie-settings], button:has-text("Settings")').first()

    await settingsButton.click()
    await page.waitForTimeout(500)

    const preferencesModal = page.locator('[data-cookie-preferences]')
    await expect(preferencesModal).toBeVisible()
  })

  test.skip('@wip preferences modal has cookie categories', async ({ page }) => {
    // Expected: Modal should list different cookie types (essential, analytics, etc.)
    const cookieBanner = page.locator('[data-cookie-banner]')
    const settingsButton = cookieBanner.locator('[data-cookie-settings], button:has-text("Settings")').first()

    await settingsButton.click()
    await page.waitForTimeout(500)

    const preferencesModal = page.locator('[data-cookie-preferences]')

    // Look for toggle switches or checkboxes for different categories
    const categories = preferencesModal.locator('input[type="checkbox"]')
    const count = await categories.count()

    expect(count).toBeGreaterThan(0)
  })

  test.skip('@wip essential cookies cannot be disabled', async ({ page }) => {
    // Expected: Essential/necessary cookies should be always enabled
    const cookieBanner = page.locator('[data-cookie-banner]')
    const settingsButton = cookieBanner.locator('[data-cookie-settings], button:has-text("Settings")').first()

    await settingsButton.click()
    await page.waitForTimeout(500)

    const essentialCheckbox = page.locator(
      'input[name*="essential"], input[name*="necessary"]'
    ).first()

    if ((await essentialCheckbox.count()) > 0) {
      const isDisabled = await essentialCheckbox.isDisabled()
      const isChecked = await essentialCheckbox.isChecked()

      expect(isDisabled || isChecked).toBe(true)
    }
  })

  test.skip('@wip can save custom preferences', async ({ page }) => {
    // Expected: Should be able to customize and save cookie preferences
    const cookieBanner = page.locator('[data-cookie-banner]')
    const settingsButton = cookieBanner.locator('[data-cookie-settings], button:has-text("Settings")').first()

    await settingsButton.click()
    await page.waitForTimeout(500)

    // Toggle some preference
    const analyticsCheckbox = page.locator('input[name*="analytics"]').first()
    if ((await analyticsCheckbox.count()) > 0 && !(await analyticsCheckbox.isDisabled())) {
      await analyticsCheckbox.uncheck()
    }

    // Save preferences
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Confirm")').first()
    await saveButton.click()
    await page.waitForTimeout(500)

    // Banner should close
    await expect(cookieBanner).not.toBeVisible()
  })

  test.skip('@wip banner is accessible via keyboard', async ({ page }) => {
    // Expected: Can navigate and interact with keyboard
    const cookieBanner = page.locator('[data-cookie-banner]')
    await expect(cookieBanner).toBeVisible()

    // Tab to first button
    await page.keyboard.press('Tab')

    // Should be able to press Enter to activate
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Banner should have responded (closed or opened modal)
    const isBannerHidden = !(await cookieBanner.isVisible())
    const isModalOpen = await page.locator('[data-cookie-preferences]').isVisible()

    expect(isBannerHidden || isModalOpen).toBe(true)
  })

  test.skip('@wip banner has proper ARIA attributes', async ({ page }) => {
    // Expected: Banner should be accessible with proper roles
    const cookieBanner = page.locator('[data-cookie-banner]')

    const role = await cookieBanner.getAttribute('role')
    const ariaLabel = await cookieBanner.getAttribute('aria-label')
    const ariaLabelledBy = await cookieBanner.getAttribute('aria-labelledby')

    expect(role || ariaLabel || ariaLabelledBy).toBeTruthy()
  })
})
