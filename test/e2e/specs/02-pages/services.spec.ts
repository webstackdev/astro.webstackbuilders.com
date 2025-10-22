/**
 * Services List Page E2E Tests
 * Tests for /services index page
 */
import { test, expect } from '@playwright/test'
import { TEST_URLS } from '@test/e2e/fixtures/test-data'
import { setupConsoleErrorChecker } from '@test/e2e/helpers/console-errors'

test.describe('Services List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URLS.services)
  })

  test('@ready page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Services/)
  })

  test('@ready page heading displays', async ({ page }) => {
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText(/Services/)
  })

  test('@ready services section displays', async ({ page }) => {
    // Check for "Our Services" h2 heading
    const sectionHeading = page.locator('h2').filter({ hasText: 'Our Services' })
    await expect(sectionHeading).toBeVisible()
  })

  test('@ready service list displays', async ({ page }) => {
    // Services are in a list with .service-item class
    const serviceItems = page.locator('.service-item')
    await expect(serviceItems.first()).toBeVisible()
  })

  test('@ready service cards have required elements', async ({ page }) => {
    const firstCard = page.locator('.service-item').first()

    // Each service should have h3 title
    await expect(firstCard.locator('h3')).toBeVisible()

    // Should have a link to the service detail page
    await expect(firstCard.locator('a')).toBeVisible()
  })

  test('@ready service links are functional', async ({ page }) => {
    const firstLink = page.locator('.service-item a').first()
    await expect(firstLink).toHaveAttribute('href', /\/services\/.+/)
  })

  test('@ready clicking service navigates to detail page', async ({ page }) => {
    const firstLink = page.locator('.service-item a').first()
    const href = await firstLink.getAttribute('href')

    await firstLink.click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain(href!)
  })

  test('@ready responsive: mobile view renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('.service-item').first()).toBeVisible()
  })

  test('@ready page has no console errors', async ({ page }) => {
    const errorChecker = setupConsoleErrorChecker(page)
    await page.goto(TEST_URLS.services)
    await page.waitForLoadState('networkidle')
    expect(errorChecker.getFiltered404s().length).toBe(0)
  })
})
