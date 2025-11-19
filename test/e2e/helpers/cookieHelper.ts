/**
 * Cookie Modal and Test Setup Helpers for E2E Tests
 * Provides utilities for handling cookie consent modal and common test setups
 */
import type { Page } from '@playwright/test'
import { expect } from '@test/e2e/helpers'
import { waitForAnimationFrames } from '@test/e2e/helpers/waitHelpers'

/**
 * Dismiss cookie consent modal if it's visible
 */
export async function dismissCookieModal(page: Page): Promise<void> {
  try {
    // Set consent cookies
    await page.evaluate(() => {
      document.cookie = 'consent_analytics=true; path=/; max-age=31536000'
      document.cookie = 'consent_marketing=true; path=/; max-age=31536000'
      document.cookie = 'consent_functional=true; path=/; max-age=31536000'

      // Clear localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('cookieConsent')
        localStorage.removeItem('gdprConsent')
      }
    })

    // Force hide the modal
    await page.evaluate(() => {
      const modal = document.getElementById('consent-modal-id')
      if (modal) {
        modal.style.display = 'none'
      }
    })

    // Click dismiss button if available
    const dismissSelector = '[data-testid="cookie-consent-dismiss"], [data-testid="consent-accept"], .consent-accept'
    const dismissButton = page.locator(dismissSelector).first()
    if (await dismissButton.isVisible()) {
      await dismissButton.click()
    }
  } catch (error) {
    // Silently continue if modal dismissal fails
    console.debug('Cookie modal dismissal failed:', error)
  }
}

/**
 * Dismisses cookie consent modal if it's visible and ensures proper consent cookies are set
 * Enhanced for View Transitions compatibility
 */
export async function setConsentCookies(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.cookie = 'consent_analytics=true; path=/; max-age=31536000'
    document.cookie = 'consent_marketing=true; path=/; max-age=31536000'
    document.cookie = 'consent_functional=true; path=/; max-age=31536000'
  })
}

/**
 * Sets up a page with cookie consent dismissed for testing
 * Use this at the beginning of tests that need to interact with UI elements
 */
export async function setupTestPage(page: Page, url: string = '/'): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' })

  // Wait for Astro scripts to hydrate the main content
  await page.waitForFunction(() => !!document.getElementById('main-content'))

  await dismissCookieModal(page)
}

/**
 * Enhanced page setup that also clears storage and handles theme reset
 * Use this for tests that need a completely clean state
 */
export async function setupCleanTestPage(page: Page, url: string = '/'): Promise<void> {
  // Clear all storage and cookies before navigation
  await page.context().clearCookies()

  await page.goto(url)

  // Clear localStorage and sessionStorage (including any persistent state)
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()

    // Clear any persistent nanostore state that might have been saved
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('theme') || key.startsWith('consent') || key.startsWith('store')) {
        localStorage.removeItem(key)
      }
    })
  })

  // Force a hard reload to ensure clean state (bypass View Transitions cache)
  await page.reload({ waitUntil: 'domcontentloaded' })

  // Dismiss cookie modal after reload
  await dismissCookieModal(page)
}

/**
 * Theme picker helper - gets the theme toggle button
 * Provides a consistent way to access theme picker across tests
 */
export function getThemePickerToggle(page: Page) {
  return page.locator('.themepicker-toggle__toggle-btn')
}

/**
 * Theme selection helper - clicks a specific theme option
 * Now handles the case where modal persists across navigation/actions
 */
export async function selectTheme(page: Page, themeId: string): Promise<void> {
  // Check if modal is already open (modal state now persists)
  const modal = page.locator('[data-theme-modal]')
  const toggleButton = getThemePickerToggle(page)
  const isOpen = await modal.evaluate((el) => !el.hasAttribute('hidden'))

  // Only click toggle if modal is not already open
  if (!isOpen) {
    await toggleButton.click()
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
    await expect(modal).toBeVisible()
    await expect(modal).toHaveClass(/is-open/)
  }

  // Click the theme button
  // Use button selector to avoid matching <html data-theme="...">
  const themeButton = page.locator(`button[data-theme="${themeId}"]`)
  await themeButton.click()

  // Wait for current theme to update everywhere
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', themeId)
  await page.waitForFunction((id) => {
    try {
      return localStorage.getItem('theme') === id
    } catch {
      return false
    }
  }, themeId)
  await waitForAnimationFrames(page, 2)
}