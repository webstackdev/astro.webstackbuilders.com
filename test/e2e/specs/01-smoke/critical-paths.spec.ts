/**
 * Critical Path Smoke Tests
 * These tests verify the most essential functionality of the site.
 * They should always pass and run quickly.
 */
import { test, expect } from '@playwright/test'
import { TEST_URLS } from '@test/e2e/fixtures/test-data'
import { setupConsoleErrorChecker, logConsoleErrors } from '@test/e2e/helpers/console-errors'
import { clearConsentCookies } from '@test/e2e/helpers/browser-state'

test.describe('Critical Paths @smoke', () => {
  test('@ready all main pages are accessible', async ({ page }) => {
    const mainPages = [
      { path: TEST_URLS.home, title: /Webstack Builders/ },
      { path: TEST_URLS.about, title: /About/ },
      { path: TEST_URLS.articles, title: /Articles/ },
      { path: TEST_URLS.services, title: /Services/ },
      { path: TEST_URLS.caseStudies, title: /Case Studies/ },
      { path: TEST_URLS.contact, title: /Contact/ },
    ]

    for (const { path, title } of mainPages) {
      await page.goto(path)
      await expect(page).toHaveTitle(title)
      await expect(page.locator('main')).toBeVisible()
    }
  })

  test('@ready navigation works across all pages', async ({ page }) => {
    // Issue: Need to verify - mobile nav may have issues
    // Expected: Can navigate between all main pages via nav menu
    // Actual: Unknown - needs testing

    await page.goto(TEST_URLS.home)

    // Click About link
    await page.click('a[href="/about"]')
    await expect(page).toHaveURL(/\/about/)

    // Click Articles link
    await page.click('a[href="/articles"]')
    await expect(page).toHaveURL(/\/articles/)

    // Click Services link
    await page.click('a[href="/services"]')
    await expect(page).toHaveURL(/\/services/)

    // Click Contact link
    await page.click('a[href="/contact"]')
    await expect(page).toHaveURL(/\/contact/)
  })

  test('@ready footer is present on all pages', async ({ page }) => {
    const pages = [TEST_URLS.home, TEST_URLS.about, TEST_URLS.contact]

    for (const path of pages) {
      await page.goto(path)
      await expect(page.locator('footer')).toBeVisible()
    }
  })

  test('@ready contact form loads and is visible', async ({ page }) => {
    // Expected: Contact form should be visible with all required fields
    // Actual: Unknown - needs testing

    await page.goto(TEST_URLS.contact)
    await expect(page.locator('#contactForm')).toBeVisible()
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#message')).toBeVisible()
  })

  test('@ready newsletter form is present on homepage', async ({ page }) => {
    // Expected: Newsletter form should be visible on homepage
    // Actual: Unknown - needs testing

    await page.goto(TEST_URLS.home)
    await expect(page.locator('#newsletter-form')).toBeVisible()
    await expect(page.locator('#newsletter-email')).toBeVisible()
    await expect(page.locator('#newsletter-gdpr-consent')).toBeVisible()
  })

  test('@ready 404 page displays for invalid routes', async ({ page }) => {
    await page.goto(TEST_URLS.notFound)

    // Should show 404 content
    await expect(page.locator('h1')).toContainText(/404|Not Found/i)
  })

  test('@ready theme picker is accessible', async ({ page }) => {
    // Expected: Theme picker button should be visible and clickable
    // Actual: Unknown - needs testing

    await page.goto(TEST_URLS.home)
    await expect(page.locator('button[aria-label="toggle theme switcher"]')).toBeVisible()
  })

  test('@ready cookie consent banner appears', async ({ page, context }) => {
    // Clear consent cookies to force banner to appear
    await clearConsentCookies(context)

    await page.goto(TEST_URLS.home)
    await page.waitForLoadState('networkidle')

    // Cookie modal should be visible
    await expect(page.locator('#cookie-modal-id')).toBeVisible()
  })

  test('@ready main pages have no 404 errors', async ({ page }) => {
    const mainPages = [
      TEST_URLS.home,
      TEST_URLS.about,
      TEST_URLS.articles,
      TEST_URLS.services,
      TEST_URLS.caseStudies,
      TEST_URLS.contact,
    ]

    for (const path of mainPages) {
      const errorChecker = setupConsoleErrorChecker(page)

      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // Should have zero 404s (not filtered, actual count)
      expect(errorChecker.failed404s).toHaveLength(0)
    }
  })

  test('@ready main pages have no console errors', async ({ page }) => {
    const mainPages = [TEST_URLS.home, TEST_URLS.about, TEST_URLS.articles, TEST_URLS.contact]

    for (const path of mainPages) {
      const errorChecker = setupConsoleErrorChecker(page)

      await page.goto(path)
      await page.waitForLoadState('networkidle')

      logConsoleErrors(errorChecker)

      // Fail if there are any unexpected 404s or errors
      expect(errorChecker.getFilteredErrors()).toHaveLength(0)
      expect(errorChecker.getFiltered404s()).toHaveLength(0)
    }
  })
})
