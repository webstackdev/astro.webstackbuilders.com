/**
 * Cookie Modal and Test Setup Helpers for E2E Tests
 * Provides utilities for handling cookie consent modal and common test setups
 */
import type { Page } from '@playwright/test'

/**
 * Dismisses cookie consent modal if it's visible and ensures proper consent cookies are set
 * Enhanced for View Transitions compatibility
 */
export async function dismissCookieModal(page: Page): Promise<void> {
  // Always ensure proper consent cookies are set, regardless of modal state
  await page.evaluate(() => {
    // Set all consent cookies to true for testing
    document.cookie = 'consent_necessary=true; path=/; max-age=31536000'
    document.cookie = 'consent_analytics=true; path=/; max-age=31536000'
    document.cookie = 'consent_advertising=true; path=/; max-age=31536000'
    document.cookie = 'consent_functional=true; path=/; max-age=31536000'

    // Also clear any persistent state that might interfere
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cookieConsent')
      localStorage.removeItem('gdprConsent')
    }
  })

  // Wait for DOM to be ready
  await page.waitForLoadState('domcontentloaded')

  const cookieModalVisible = await page.evaluate(() => {
    const modal = document.getElementById('cookie-modal-id')
    return modal ? window.getComputedStyle(modal).display !== 'none' : false
  })

  if (cookieModalVisible) {
    try {
      // Try multiple selector strategies
      const allowButton = page.locator('.cookie-modal__btn-allow').first()
      const altButton = page.locator('[data-consent-action="allow-all"]').first()

      if (await allowButton.count() > 0) {
        await allowButton.click()
      } else if (await altButton.count() > 0) {
        await altButton.click()
      }

      // Wait for modal to close and main content to be restored
      await page.waitForFunction(() => {
        const modal = document.getElementById('cookie-modal-id')
        const main = document.getElementById('main-content')
        return modal && window.getComputedStyle(modal).display === 'none' &&
               main && !main.hasAttribute('inert')
      }, { timeout: 10000 })
    } catch {
      // If clicking fails, try to force hide the modal
      await page.evaluate(() => {
        const modal = document.getElementById('cookie-modal-id')
        if (modal) {
          modal.style.display = 'none'
        }
        const main = document.getElementById('main-content')
        if (main && main.hasAttribute('inert')) {
          main.removeAttribute('inert')
        }
      })
    }
  }
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
 */
export async function selectTheme(page: Page, themeId: string): Promise<void> {
  const themePicker = getThemePickerToggle(page)
  await themePicker.click()
  await page.waitForTimeout(300)
  // Use button selector to avoid matching <html data-theme="...">
  await page.click(`button[data-theme="${themeId}"]`)
  await page.waitForTimeout(300)
}