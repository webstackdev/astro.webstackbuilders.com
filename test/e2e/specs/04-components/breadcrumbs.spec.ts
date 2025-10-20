/**
 * Breadcrumbs Component Tests
 * Tests for breadcrumb navigation
 * @see src/components/Breadcrumbs/
 */

import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'

test.describe('Breadcrumbs Component', () => {
  test.skip('@wip breadcrumbs display on article pages', async ({ page }) => {
    // Expected: Breadcrumbs should appear on article detail pages
    await page.goto(TEST_URLS.articles)
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const breadcrumbs = page.locator('[data-breadcrumbs], nav[aria-label*="readcrumb"]')
    await expect(breadcrumbs).toBeVisible()
  })

  test.skip('@wip breadcrumbs display on service pages', async ({ page }) => {
    // Expected: Breadcrumbs should appear on service detail pages
    await page.goto(TEST_URLS.services)
    const firstService = page.locator('a[href*="/services/"]').first()
    await firstService.click()
    await page.waitForLoadState('networkidle')

    const breadcrumbs = page.locator('[data-breadcrumbs], nav[aria-label*="readcrumb"]')
    await expect(breadcrumbs).toBeVisible()
  })

  test.skip('@wip breadcrumbs show correct path', async ({ page }) => {
    // Expected: Breadcrumbs should reflect page hierarchy
    await page.goto(TEST_URLS.articles)
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const breadcrumbs = page.locator('[data-breadcrumbs], nav[aria-label*="readcrumb"]')
    const links = breadcrumbs.locator('a')

    const count = await links.count()
    expect(count).toBeGreaterThan(0)

    // First link should be Home
    const firstLink = links.first()
    const firstLinkText = await firstLink.textContent()
    expect(firstLinkText?.toLowerCase()).toContain('home')
  })

  test.skip('@wip breadcrumb links are clickable', async ({ page }) => {
    // Expected: Can navigate back using breadcrumb links
    await page.goto(TEST_URLS.articles)
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const breadcrumbs = page.locator('[data-breadcrumbs], nav[aria-label*="readcrumb"]')
    const homeLink = breadcrumbs.locator('a').first()

    await homeLink.click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).toBe(TEST_URLS.home)
  })

  test.skip('@wip current page is not a link', async ({ page }) => {
    // Expected: Current page in breadcrumbs should not be clickable
    await page.goto(TEST_URLS.articles)
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const breadcrumbs = page.locator('[data-breadcrumbs], nav[aria-label*="readcrumb"]')
    const lastItem = breadcrumbs.locator('li, span').last()

    // Last item should either have aria-current or not be a link
    const ariaCurrent = await lastItem.getAttribute('aria-current')
    const isLink = (await lastItem.locator('a').count()) === 0

    expect(ariaCurrent === 'page' || isLink).toBe(true)
  })

  test.skip('@wip breadcrumbs have proper separators', async ({ page }) => {
    // Expected: Breadcrumb items should be separated visually
    await page.goto(TEST_URLS.articles)
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const breadcrumbs = page.locator('[data-breadcrumbs], nav[aria-label*="readcrumb"]')
    const items = breadcrumbs.locator('li, span')

    const count = await items.count()
    expect(count).toBeGreaterThan(1)

    // Check for separator (/, >, or similar)
    const breadcrumbsText = await breadcrumbs.textContent()
    const hasSeparator = breadcrumbsText?.includes('/') || breadcrumbsText?.includes('>')

    expect(hasSeparator).toBe(true)
  })

  test.skip('@wip breadcrumbs use proper ARIA', async ({ page }) => {
    // Expected: Should use nav with aria-label="Breadcrumb"
    await page.goto(TEST_URLS.articles)
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const breadcrumbs = page.locator('nav[aria-label*="readcrumb"]')
    await expect(breadcrumbs).toBeVisible()

    // Should contain ordered list
    const list = breadcrumbs.locator('ol, ul')
    await expect(list).toBeVisible()
  })

  test.skip('@wip breadcrumbs are responsive', async ({ page }) => {
    // Expected: Breadcrumbs should be readable on mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(TEST_URLS.articles)
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const breadcrumbs = page.locator('[data-breadcrumbs], nav[aria-label*="readcrumb"]')
    await expect(breadcrumbs).toBeVisible()
  })

  test.skip('@wip breadcrumbs have structured data', async ({ page }) => {
    // Expected: Should include JSON-LD schema for breadcrumbs
    await page.goto(TEST_URLS.articles)
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents()
    const hasBreadcrumbSchema = jsonLd.some((json) => json.includes('BreadcrumbList'))

    expect(hasBreadcrumbSchema).toBe(true)
  })

  test.skip('@wip breadcrumbs truncate long titles', async ({ page }) => {
    // Expected: Very long page titles should be truncated in breadcrumbs
    await page.goto(TEST_URLS.articles)
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const breadcrumbs = page.locator('[data-breadcrumbs], nav[aria-label*="readcrumb"]')
    const lastItem = breadcrumbs.locator('li, span').last()

    // Check for ellipsis or max-width
    const hasEllipsis = await lastItem.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.textOverflow === 'ellipsis' || styles.overflow === 'hidden'
    })

    // Test passes if either truncation is applied or text is reasonably short
    const text = await lastItem.textContent()
    expect(hasEllipsis || (text && text.length < 50)).toBe(true)
  })
})
