/**
 * Service Detail Page E2E Tests
 * Tests for individual service pages
 * Note: Tests are dynamically generated for each service
 */
import { test, expect } from '@playwright/test'
import { setupConsoleErrorChecker } from '@test/e2e/helpers/console-errors'

/**
 * Create a test suite for a specific service
 */
function createServiceTests(serviceId: string, serviceTitle: string) {
  const serviceUrl = `/services/${serviceId}`

  test.describe(`Service: ${serviceTitle}`, () => {
    test('@ready service page loads with content', async ({ page }) => {
      await page.goto(serviceUrl)
      await page.waitForLoadState('networkidle')

      // Page should have main content
      const main = page.locator('main')
      await expect(main).toBeVisible()

      // Should have h1 heading (page may have multiple h1 in suggested services, use first)
      const heading = page.locator('h1').first()
      await expect(heading).toBeVisible()

      // Should have article container with id (main article, not carousel articles)
      const article = page.locator('article[itemscope]')
      await expect(article).toBeVisible()
    })

    test('@ready service title displays correctly', async ({ page }) => {
      await page.goto(serviceUrl)
      // Use the main article heading, not headings from suggested services carousel
      const heading = page.locator('h1#article-title')
      await expect(heading).toContainText(serviceTitle)
    })

    test('@ready service content renders', async ({ page }) => {
      await page.goto(serviceUrl)

      // Should have content paragraphs
      const content = page.locator('article p')
      await expect(content.first()).toBeVisible()
    })

    test('@ready suggested services carousel displays', async ({ page }) => {
      await page.goto(serviceUrl)

      // Carousel should be present (if there are other services)
      const carousel = page.locator('.embla')
      // Carousel only shows if there are other services, so check count
      const count = await carousel.count()
      if (count > 0) {
        await expect(carousel.first()).toBeVisible()
      }
    })

    test('@ready page has no console errors', async ({ page }) => {
      const errorChecker = setupConsoleErrorChecker(page)
      await page.goto(serviceUrl)
      await page.waitForLoadState('networkidle')

      const filtered404s = errorChecker.getFiltered404s()
      expect(filtered404s.length).toBe(0)
    })

    test('@ready page has no 404 errors', async ({ page }) => {
      const errorChecker = setupConsoleErrorChecker(page)
      await page.goto(serviceUrl)
      await page.waitForLoadState('networkidle')

      const all404s = errorChecker.failed404s
      expect(all404s.length).toBe(0)
    })
  })
}

// Generate tests for known services
createServiceTests('overview', 'Services Overview')
createServiceTests('create-custom-font-sets', 'Create Custom Font Sets')