/**
 * Services List Page E2E Tests
 * Tests for /services index page
 */
import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'

test.describe('Services List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URLS.services)
  })

  test.skip('@wip page loads with correct title', async ({ page }) => {
    // Expected: Services page should have descriptive title
    // Actual: Unknown - needs testing
    await expect(page).toHaveTitle(/Services/)
  })

  test.skip('@wip hero section displays', async ({ page }) => {
    // Expected: Should have hero section with heading
    // Actual: Unknown - needs testing
    await expect(page.locator('h1')).toBeVisible()
  })

  test.skip('@wip services grid displays', async ({ page }) => {
    // Expected: Should show grid of service cards
    // Actual: Unknown - needs testing
    const serviceCards = page.locator('article, .service-card')
    await expect(serviceCards.first()).toBeVisible()
  })

  test.skip('@wip service cards have required elements', async ({ page }) => {
    // Expected: Each card should have icon/image, title, description
    // Actual: Unknown - needs testing
    const firstCard = page.locator('article, .service-card').first()
    await expect(firstCard.locator('h2, h3')).toBeVisible()
  })

  test.skip('@wip service links are functional', async ({ page }) => {
    // Expected: Clicking service should navigate to detail page
    // Actual: Unknown - needs testing
    const firstLink = page.locator('article a, .service-card a').first()
    await expect(firstLink).toHaveAttribute('href', /.+/)
  })

  test.skip('@wip CTA section present', async ({ page }) => {
    // Expected: Should have call-to-action for consultation
    // Actual: Unknown - needs testing
    // Check for CTA button or section
  })

  test.skip('@wip page has no console errors', async ({ page }) => {
    // Expected: No console errors on page load
    // Actual: Unknown - needs testing
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.reload()
    expect(errors).toHaveLength(0)
  })
})
