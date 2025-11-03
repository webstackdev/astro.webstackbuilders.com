/**
 * Cookie Consent Banner Tests
 * Tests for cookie consent banner display and functionality
 * @see src/components/Cookies/
 */

import { test, expect } from '@test/e2e/helpers'


test.describe('Cookie Consent Banner', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and storage before navigation
    await context.clearCookies()

    // Navigate to page and clear storage
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // Wait for cookie banner to be initialized
    await page.waitForTimeout(1000)
  })

  test('@ready cookie banner displays on first visit', async ({ page }) => {
    // Expected: Cookie consent banner should appear for first-time visitors
    const cookieBanner = page.locator('#cookie-modal-id')
    await expect(cookieBanner).toBeVisible()
  })

  test('@ready cookie banner has accept button', async ({ page }) => {
    // Expected: Banner should have "Allow All" button
    const cookieBanner = page.locator('#cookie-modal-id')
    const acceptButton = cookieBanner.locator('button:has-text("Allow All")')

    await expect(acceptButton).toBeVisible()
  })

  test('@ready cookie banner has customize link', async ({ page }) => {
    // Expected: Banner should have "Customize" link
    const cookieBanner = page.locator('#cookie-modal-id')
    const customizeLink = cookieBanner.getByRole('link', { name: 'Customize' })

    await expect(customizeLink).toBeVisible()
    await expect(customizeLink).toHaveAttribute('href', '/cookies')
  })

  test('@ready clicking allow all hides banner', async ({ page }) => {
    // Expected: Banner should disappear after accepting
    const cookieBanner = page.locator('#cookie-modal-id')
    const acceptButton = cookieBanner.locator('button:has-text("Allow All")')

    await acceptButton.click()
    await page.waitForTimeout(500)

    await expect(cookieBanner).not.toBeVisible()
  })

  test('@ready accept choice persists across page reloads', async ({ page }) => {
    // Expected: After accepting, banner should not reappear
    const cookieBanner = page.locator('#cookie-modal-id')
    const acceptButton = cookieBanner.locator('button:has-text("Allow All")')

    await acceptButton.click()
    await page.waitForTimeout(500)

    await page.reload()
    await page.waitForTimeout(500)

    await expect(cookieBanner).not.toBeVisible()
  })

  test('@ready accept choice persists across navigation', async ({ page }) => {
    // Expected: After accepting, banner should not appear on other pages
    const cookieBanner = page.locator('#cookie-modal-id')
    const acceptButton = cookieBanner.locator('button:has-text("Allow All")')

    await acceptButton.click()
    await page.waitForTimeout(500)

    await page.goto('/about')
    await page.waitForTimeout(500)

    await expect(cookieBanner).not.toBeVisible()
  })

  test('@ready banner contains privacy policy link', async ({ page }) => {
    // Expected: Banner should link to privacy/cookie policy
    const cookieBanner = page.locator('#cookie-modal-id')
    const policyLink = cookieBanner.locator('a[href*="privacy"], a[href*="cookie"]')

    await expect(policyLink.first()).toBeVisible()
  })

  test('@ready banner is accessible via keyboard', async ({ page }) => {
    // Expected: Can navigate and interact with keyboard
    const cookieBanner = page.locator('#cookie-modal-id')
    await expect(cookieBanner).toBeVisible()

    // Tab to first interactive element (close button)
    await page.keyboard.press('Tab')

    // Tab to Allow All button
    await page.keyboard.press('Tab')

    // Should be able to press Enter to activate
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Banner should be hidden after accepting
    await expect(cookieBanner).not.toBeVisible()
  })

  test('@ready banner has proper ARIA attributes', async ({ page }) => {
    // Expected: Banner should be accessible with proper roles
    const cookieBanner = page.locator('#cookie-modal-id')

    const role = await cookieBanner.getAttribute('role')
    const ariaLabel = await cookieBanner.getAttribute('aria-label')

    expect(role).toBe('dialog')
    expect(ariaLabel).toBeTruthy()
  })
})
