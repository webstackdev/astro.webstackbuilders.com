/**
 * Helper utilities for managing browser state (cookies, localStorage, etc.) in E2E tests
 */
import { type Page, type BrowserContext } from '@playwright/test'

/**
 * Clear all consent cookies to force the cookie banner to appear
 *
 * @param context - Playwright browser context
 * @param url - The URL to clear cookies for (default: localhost:4321)
 *
 * @example
 * await clearConsentCookies(context)
 * await page.goto('/')
 * // Cookie consent banner should now be visible
 */
export async function clearConsentCookies(
  context: BrowserContext,
  url = 'http://localhost:4321'
): Promise<void> {
  const cookies = await context.cookies(url)

  // Filter out consent cookies
  const consentCookieNames = [
    'consent_necessary',
    'consent_analytics',
    'consent_advertising',
    'consent_functional',
  ]

  const consentCookies = cookies.filter((cookie) => consentCookieNames.includes(cookie.name))

  // Delete each consent cookie
  for (const cookie of consentCookies) {
    await context.clearCookies({ name: cookie.name })
  }
}

/**
 * Clear all cookies and localStorage
 *
 * @param context - Playwright browser context
 * @param page - Playwright page instance
 *
 * @example
 * await clearBrowserState(context, page)
 */
export async function clearBrowserState(context: BrowserContext, page: Page): Promise<void> {
  await context.clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}
