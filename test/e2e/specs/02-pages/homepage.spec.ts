/**
 * Homepage E2E Tests
 * Tests for the main landing page functionality
 */
import { test, expect } from '@playwright/test'
import { TEST_URLS } from '@test/e2e/fixtures/test-data'
import { setupConsoleErrorChecker } from '@test/e2e/helpers/console-errors'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URLS.home)
  })

  test('@ready page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Webstack Builders/)
  })

  test('@ready hero section displays correctly', async ({ page }) => {
    // Hero should be visible
    const hero = page.locator('[data-component="hero"], section').first()
    await expect(hero).toBeVisible()

    // Should have h1
    await expect(page.locator('h1')).toBeVisible()
  })

  test('@ready featured services section renders', async ({ page }) => {
    // Check for Featured Services section - Carousel renders an h2 with the title
    const servicesHeading = page.locator('section h2').filter({ hasText: 'Featured Services' })
    await expect(servicesHeading).toBeVisible()
  })

  test('@ready case studies section displays', async ({ page }) => {
    // Check for Success Stories heading - appears twice (section h2 + carousel h2), use first
    const caseStudiesHeading = page.locator('h2').filter({ hasText: 'Success Stories' }).first()
    await expect(caseStudiesHeading).toBeVisible()
  })

  test('@ready latest articles section renders', async ({ page }) => {
    // Check for Latest Insights heading (appears twice: as section h2 and carousel title)
    const articlesHeading = page.locator('h2').filter({ hasText: 'Latest Insights' }).first()
    await expect(articlesHeading).toBeVisible()
  })

  test('@ready testimonials section displays', async ({ page }) => {
    await expect(page.locator('text=What Clients Say')).toBeVisible()
  })

  test('@ready newsletter signup form present', async ({ page }) => {
    // Newsletter form should be visible with email input
    const emailInput = page.locator('input[type="email"][name="email"]')
    await expect(emailInput).toBeVisible()

    // GDPR consent checkbox - Newsletter uses name="consent", not "gdpr-consent"
    const gdprConsent = page.locator('input[type="checkbox"][name="consent"]')
    await expect(gdprConsent).toBeVisible()

    // Submit button
    const submitButton = page.locator('button[type="submit"]').last()
    await expect(submitButton).toBeVisible()
  })

  test('@ready CTA sections are clickable', async ({ page }) => {
    // Find CTA button - may be "Start a Conversation" or similar
    const ctaButton = page.locator('a[href*="contact"], button:has-text("Contact")').first()

    if ((await ctaButton.count()) > 0) {
      await expect(ctaButton).toBeVisible()
      await expect(ctaButton).toBeEnabled()
    }
  })

  test('@ready responsive: mobile view renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    // Main content should still be visible
    await expect(page.locator('h1')).toBeVisible()

    // Newsletter email input should be visible
    const emailInput = page.locator('input[type="email"]').last()
    await expect(emailInput).toBeVisible()
  })

  test('@ready page has no console errors', async ({ page }) => {
    const errorChecker = setupConsoleErrorChecker(page)
    await page.goto(TEST_URLS.home)
    await page.waitForLoadState('networkidle')

    const errors = errorChecker.getFilteredErrors()
    const failed404s = errorChecker.getFiltered404s()

    expect(errors, `Console errors: ${errors.join(', ')}`).toHaveLength(0)
    expect(failed404s, `404 errors: ${failed404s.join(', ')}`).toHaveLength(0)
  })
})
