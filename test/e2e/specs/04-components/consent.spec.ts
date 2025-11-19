/**
 * Consent Banner Tests
 * Tests for cookie consent banner display and functionality
 * @see src/components/Consent/
 */

import { BasePage, test, expect } from '@test/e2e/helpers'

const consentModalSelector = '#consent-modal-id'

const getConsentBanner = (page: BasePage) => page.locator(consentModalSelector)

async function waitForConsentBannerHidden(page: BasePage): Promise<void> {
  await expect(getConsentBanner(page)).toBeHidden({ timeout: 5000 })
}


test.describe('Consent Banner', () => {
  /**
   * Setup for consent banner tests
   *
   * Side effects relied upon:
   * - Clears all cookies and storage (localStorage, sessionStorage) to simulate first visit
   * - Navigates to homepage where consent banner appears
   * - Waits for consent banner modal to initialize and render
   *
   * Without this setup, tests would fail due to:
   * - Previous consent choices persisting from earlier tests, hiding the banner
   * - Consent banner not appearing (it only shows on first visit without consent cookie)
   * - Race conditions where banner hasn't finished initializing before tests interact with it
   *
   * This ensures each test starts with a clean state simulating a first-time visitor
   * who needs to see and interact with the consent banner
   */
  test.beforeEach(async ({ page: playwrightPage, context }) => {
    const page = await BasePage.init(playwrightPage)
    // Clear all cookies and storage before navigation
    await context.clearCookies()

    // Navigate to page and clear storage
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // Wait for consent banner custom element to be initialized
    await page.waitForFunction(() => {
      const element = document.querySelector<HTMLElement & { isInitialized?: boolean }>('consent-banner')
      return element?.isInitialized === true
    }, { timeout: 5000 })
  })

  test('@ready consent banner displays on first visit', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Consent banner should appear for first-time visitors
    const cookieBanner = getConsentBanner(page)
    await expect(cookieBanner).toBeVisible()
  })

  test('@ready consent banner has accept button', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Consent banner should have "Allow All" button
    const cookieBanner = getConsentBanner(page)
    const acceptButton = cookieBanner.locator('button:has-text("Allow All")')

    await expect(acceptButton).toBeVisible()
  })

  test('@ready consent banner has customize link', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Consent banner should have "Customize" link
    const cookieBanner = getConsentBanner(page)
    const customizeLink = cookieBanner.getByRole('link', { name: 'Customize' })

    await expect(customizeLink).toBeVisible()
    await expect(customizeLink).toHaveAttribute('href', '/consent')
  })

  test('@ready clicking allow all hides banner', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Consent banner should disappear after accepting
    const cookieBanner = getConsentBanner(page)
    const acceptButton = cookieBanner.locator('button:has-text("Allow All")')

    await acceptButton.click()
    await waitForConsentBannerHidden(page)
  })

  test('@ready accept choice persists across page reloads', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: After accepting, banner should not reappear
    const cookieBanner = getConsentBanner(page)
    const acceptButton = cookieBanner.locator('button:has-text("Allow All")')

    await acceptButton.click()
    await waitForConsentBannerHidden(page)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')

    await expect(cookieBanner).toBeHidden()
  })

  test('@ready accept choice persists across navigation', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: After accepting, banner should not appear on other pages
    const cookieBanner = getConsentBanner(page)
    const acceptButton = cookieBanner.locator('button:has-text("Allow All")')

    await acceptButton.click()
    await waitForConsentBannerHidden(page)

    await page.goto('/about')
    await page.waitForLoadState('networkidle')

    await expect(cookieBanner).toBeHidden()
  })

  test('@ready banner contains privacy policy link', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected:  Consentbanner should link to privacy/cookie policy
    const cookieBanner = getConsentBanner(page)
    const policyLink = cookieBanner.locator('a[href*="privacy"], a[href*="cookie"]')

    await expect(policyLink.first()).toBeVisible()
  })

  test('@ready banner is accessible via keyboard', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Can navigate and interact with keyboard
    const cookieBanner = getConsentBanner(page)
    await expect(cookieBanner).toBeVisible()

    // Tab to first interactive element (close button)
    await page.keyboard.press('Tab')

    // Tab to Allow All button
    await page.keyboard.press('Tab')

    // Should be able to press Enter to activate
    await page.keyboard.press('Enter')
    await waitForConsentBannerHidden(page)
  })

  test('@ready banner has proper ARIA attributes', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Consent banner should be accessible with proper roles
    const cookieBanner = page.locator('#consent-modal-id')

    const role = await cookieBanner.getAttribute('role')
    const ariaLabel = await cookieBanner.getAttribute('aria-label')

    expect(role).toBe('dialog')
    expect(ariaLabel).toBeTruthy()
  })
})
