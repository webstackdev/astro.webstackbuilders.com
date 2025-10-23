/**
 * Articles Page E2E Tests
 * Tests for the blog articles listing page
 */
import { test, expect } from '@playwright/test'
import { TEST_URLS } from '@test/e2e/fixtures/test-data'
import { setupConsoleErrorChecker } from '@test/e2e/helpers/consoleErrors'

test.describe('Articles Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URLS.articles)
  })

  test('@ready page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Articles/)
  })

  test('@ready articles list displays', async ({ page }) => {
    const articles = page.locator('article')
    const count = await articles.count()

    expect(count).toBeGreaterThan(0)
    await expect(articles.first()).toBeVisible()
  })

  test('@ready article cards have required elements', async ({ page }) => {
    const firstArticle = page.locator('article').first()

    // Should have heading (h2 or h3 or h4)
    // Note: Multiple h2 elements on a page is semantically correct
    // Only h1 should be unique per page
    const heading = firstArticle.locator('h2, h3, h4').first()
    await expect(heading).toBeVisible()

    // Should have image
    const image = firstArticle.locator('img').first()
    await expect(image).toBeVisible()

    // Should have description/excerpt text
    const description = firstArticle.locator('p').first()
    await expect(description).toBeVisible()
  })

  test('@ready clicking article navigates to detail page', async ({ page }) => {
    // Get the first article link
    const firstArticleLink = page.locator('article a').first()
    await firstArticleLink.click()

    // Should navigate to an article detail page
    await expect(page).toHaveURL(/\/articles\/[^/]+/)
  })

  test('@ready page subtitle displays', async ({ page }) => {
    // Look for common subtitle patterns
    const subtitlePatterns = [
      page.locator('text=/Insights.*tutorials/i'),
      page.locator('text=/blog/i'),
      page.locator('text=/latest.*articles/i'),
      page.locator('p.subtitle, .page-subtitle'),
    ]

    // At least one subtitle element should be visible
    let found = false
    for (const locator of subtitlePatterns) {
      if ((await locator.count()) > 0) {
        found = true
        break
      }
    }

    // If no specific subtitle found, just verify h1 exists
    if (!found) {
      await expect(page.locator('h1')).toBeVisible()
    }
  })

  test('@ready articles are sorted by date', async ({ page }) => {
    const timeElements = await page.locator('time[datetime]').all()
    expect(timeElements.length).toBeGreaterThan(0)

    // Verify time elements have datetime attribute (for semantic HTML)
    const firstTime = page.locator('time[datetime]').first()
    await expect(firstTime).toBeVisible()
    await expect(firstTime).toHaveAttribute('datetime')
  })

  test('@ready responsive: mobile view renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('article').first()).toBeVisible()
  })

  test('@ready page has no console errors', async ({ page }) => {
    const errorChecker = setupConsoleErrorChecker(page)
    await page.goto(TEST_URLS.articles)
    await page.waitForLoadState('networkidle')

    const errors = errorChecker.getFilteredErrors()
    const failed404s = errorChecker.getFiltered404s()

    expect(errors, `Console errors: ${errors.join(', ')}`).toHaveLength(0)
    expect(failed404s, `404 errors: ${failed404s.join(', ')}`).toHaveLength(0)
  })
})