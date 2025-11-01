/**
 * Cookie Modal and Test Setup Helpers for E2E Tests
 * Provides utilities for handling cookie consent modal and common test setups
 */
import type { Page } from '@playwright/test'

/**
 * Dismisses cookie consent modal if it's visible and ensures proper consent cookies are set
 * This is needed because the modal blocks interaction with other elements
 */
export async function dismissCookieModal(page: Page): Promise<void> {
  // Always ensure proper consent cookies are set, regardless of modal state
  await page.evaluate(() => {
    // Set all consent cookies to true for testing
    document.cookie = 'consent_necessary=true; path=/; max-age=31536000'
    document.cookie = 'consent_analytics=true; path=/; max-age=31536000'
    document.cookie = 'consent_advertising=true; path=/; max-age=31536000'
    document.cookie = 'consent_functional=true; path=/; max-age=31536000'
  })

  const cookieModalVisible = await page.evaluate(() => {
    const modal = document.getElementById('cookie-modal-id')
    return modal ? window.getComputedStyle(modal).display !== 'none' : false
  })

  if (cookieModalVisible) {
    // Click the "Allow All" button to dismiss the modal
    const buttonExists = await page.locator('.cookie-modal__btn-allow').count()

    if (buttonExists > 0) {
      await page.click('.cookie-modal__btn-allow')
    } else {
      // Try alternative selector if main button not found
      await page.click('[data-consent-action="allow-all"]')
    }    // Wait for modal to close and main content to be restored
    await page.waitForFunction(() => {
      const modal = document.getElementById('cookie-modal-id')
      const main = document.getElementById('main-content')
      return modal && window.getComputedStyle(modal).display === 'none' &&
             main && !main.hasAttribute('inert')
    })
  }
}/**
 * Sets up a page with cookie consent dismissed for testing
 * Use this at the beginning of tests that need to interact with UI elements
 */
export async function setupTestPage(page: Page, url: string = '/'): Promise<void> {
  await page.goto(url)
  await dismissCookieModal(page)
}

/**
 * Enhanced page setup that also clears storage and handles theme reset
 * Use this for tests that need a completely clean state
 */
export async function setupCleanTestPage(page: Page, url: string = '/'): Promise<void> {
  await page.goto(url)

  // Clear localStorage and sessionStorage
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // Reload to apply clean state
  await page.reload()

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
  await page.click(`[data-theme="${themeId}"]`)
  await page.waitForTimeout(300)
}