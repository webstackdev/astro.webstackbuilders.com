/**
 * Homepage Smoke Test
 * Dedicated test for homepage basic functionality and app initialization
 */
import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'

test.describe('Homepage @smoke', () => {
  // Clear localStorage before each test to avoid stale data issues
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URLS.home)
    await page.evaluate(() => {
      localStorage.clear()
    })
  })

  test('@ready homepage loads successfully', async ({ page }) => {
    // Listen for console messages to check app initialization
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      consoleMessages.push(msg.text())
    })

    await page.goto(TEST_URLS.home)

    // Verify page loaded
    await expect(page).toHaveTitle(/Webstack Builders/)

    // Verify main content is visible
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()

    // Debug: log all console messages
    console.log('All console messages:', consoleMessages)

    // Verify app state initialized without errors
    const hasInitMessage = consoleMessages.some((msg) => msg.includes('App state initialized'))
    const hasErrorMessage = consoleMessages.some((msg) =>
      msg.includes('App state initialized with errors')
    )

    expect(hasInitMessage).toBe(true)
    expect(hasErrorMessage).toBe(false)
  })

  test('@ready homepage has no console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    const failed404s: string[] = []

    // Capture 404 responses with full details
    page.on('response', (response) => {
      if (response.status() === 404) {
        const url = response.url()
        const requestType = response.request().resourceType()
        failed404s.push(`${url} (${requestType})`)
      }
    })

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto(TEST_URLS.home)
    await page.waitForLoadState('networkidle')

    // Always log what we found for debugging
    if (failed404s.length > 0) {
      console.log('\n🔍 404 Resources:')
      failed404s.forEach((url) => console.log(`  - ${url}`))
    }
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:')
      consoleErrors.forEach((error) => console.log(`  - ${error}`))
    }

    // Filter out ONLY known acceptable issues
    const filtered404s = failed404s.filter(
      (url) =>
        !url.includes('favicon.ico') // favicon 404s are acceptable in dev
    )

    const filteredErrors = consoleErrors.filter(
      (error) =>
        !error.includes('ResizeObserver loop completed') // Known browser quirk
    )

    // Fail if there are any unexpected 404s or errors
    if (filtered404s.length > 0) {
      console.error('\n💥 Unexpected 404 resources found!')
    }
    if (filteredErrors.length > 0) {
      console.error('\n💥 Unexpected console errors found!')
    }

    expect(filteredErrors).toHaveLength(0)
    expect(filtered404s).toHaveLength(0)
  })
})
