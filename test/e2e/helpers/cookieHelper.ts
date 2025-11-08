/**
 * Cookie Modal and Test Setup Helpers for E2E Tests
 * Provides utilities for handling cookie consent modal and common test setups
 */
import type { Page } from '@playwright/test'

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

  // Wait a bit for any client-side initialization
  await page.waitForTimeout(100)

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
  const isOpen = await modal.evaluate((el) => el.classList.contains('is-open'))

  // Only click toggle if modal is not already open
  if (!isOpen) {
    const themePicker = getThemePickerToggle(page)
    await themePicker.click()
    await page.waitForTimeout(300)
  }

  // Click the theme button
  // Use button selector to avoid matching <html data-theme="...">
  await page.click(`button[data-theme="${themeId}"]`)
  await page.waitForTimeout(300)
}