/**
 * Cookie Modal and Test Setup Helpers for E2E Tests
 * Provides utilities for handling cookie consent modal and common test setups
 */
import type { Page } from '@playwright/test'
import { expect } from '@test/e2e/helpers'
import { waitForAnimationFrames } from '@test/e2e/helpers/waitHelpers'

type ReloadStrategy = 'reload' | 'cacheBustingGoto'

export interface SetupCleanTestPageOptions {
  loggingLabel?: string
  reloadStrategy?: ReloadStrategy
}

interface SetupSnapshot {
  url: string
  readyState: DocumentReadyState
  theme: string | null
  transitionPersistCount: number
  historyLength: number
  navigationType: string | null
  isPlaywrightControlled: boolean
}

const DEFAULT_CACHE_BUST_PARAM = '_clean'

const isAbsoluteUrl = (value: string) => /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)

const createCacheBustingUrl = (url: string, token: string): string => {
  if (isAbsoluteUrl(url)) {
    const absolute = new URL(url)
    absolute.searchParams.set(DEFAULT_CACHE_BUST_PARAM, token)
    return absolute.toString()
  }

  const relative = new URL(url, 'https://local.test')
  relative.searchParams.set(DEFAULT_CACHE_BUST_PARAM, token)
  return `${relative.pathname}${relative.search}${relative.hash}`
}

const captureSnapshot = async (page: Page): Promise<SetupSnapshot | null> => {
  try {
    return await page.evaluate(() => {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      const lastEntry = entries[entries.length - 1]
      const isPlaywrightRun = typeof window !== 'undefined' && window.isPlaywrightControlled === true

      return {
        url: window.location.href,
        readyState: document.readyState,
        theme: localStorage.getItem('theme'),
        transitionPersistCount: document.querySelectorAll('[transition\\:persist]').length,
        historyLength: history.length,
        navigationType: typeof lastEntry?.type === 'string' ? lastEntry.type : null,
        isPlaywrightControlled: isPlaywrightRun,
      }
    })
  } catch {
    return null
  }
}

const logSetupPhase = async (
  page: Page,
  label: string | undefined,
  phase: string,
  extra: Record<string, unknown> = {}
) => {
  if (!label) return
  const snapshot = await captureSnapshot(page)
  if (!snapshot) {
    console.info(`[${label}] setupCleanTestPage:${phase}`, extra)
    return
  }
  if (!snapshot.isPlaywrightControlled) return

  const { isPlaywrightControlled, ...rest } = snapshot
  console.info(`[${label}] setupCleanTestPage:${phase}`, {
    ...rest,
    ...extra,
  })
}

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
 * @param options Optional configuration for logging and reload handling
 * @param options.loggingLabel When provided, logs page state snapshots (Playwright-only)
 * @param options.reloadStrategy Toggle between reload (default) and cache-busting navigation
 */
export async function setupCleanTestPage(
  page: Page,
  url: string = '/',
  options: SetupCleanTestPageOptions = {}
): Promise<void> {
  const { loggingLabel, reloadStrategy = 'reload' } = options
  // Clear all storage and cookies before navigation
  await page.context().clearCookies()

  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await logSetupPhase(page, loggingLabel, 'initial-navigation', { reloadStrategy })

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

  await logSetupPhase(page, loggingLabel, 'storage-cleared', { reloadStrategy })

  // Force a hard reload to ensure clean state (bypass View Transitions cache)
  if (reloadStrategy === 'cacheBustingGoto') {
    const cacheBustTarget = createCacheBustingUrl(url, Date.now().toString())
    await logSetupPhase(page, loggingLabel, 'cachebust:start', { cacheBustTarget })
    await page.goto(cacheBustTarget, { waitUntil: 'domcontentloaded' })
    await logSetupPhase(page, loggingLabel, 'cachebust:complete', { cacheBustTarget })
  } else {
    await logSetupPhase(page, loggingLabel, 'reload:start')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await logSetupPhase(page, loggingLabel, 'reload:complete')
  }

  // Dismiss cookie modal after reload
  await dismissCookieModal(page)
  await logSetupPhase(page, loggingLabel, 'cookie-modal-dismissed')
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
  await modal.waitFor({ state: 'attached' })
  await toggleButton.waitFor({ state: 'visible' })
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