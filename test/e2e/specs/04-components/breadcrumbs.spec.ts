/**
 * Breadcrumbs Component Tests
 * Tests for breadcrumb navigation
 * @see src/components/Breadcrumbs/
 */

import { test, expect } from '@playwright/test'

test.describe('Breadcrumbs Component', () => {
  test('@ready breadcrumbs display on article pages', async ({ page }) => {
    await page.goto('/articles/typescript-best-practices')

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbs).toBeVisible()
  })

  test('@ready breadcrumbs display on service pages', async ({ page }) => {
    await page.goto('/services/overview')

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbs).toBeVisible()
  })

  test('@ready breadcrumbs show correct path', async ({ page }) => {
    await page.goto('/articles/typescript-best-practices')

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    const links = breadcrumbs.locator('a')

    const count = await links.count()
    expect(count).toBeGreaterThan(0)

    // First link should be Home
    const firstLink = links.first()
    const firstLinkText = await firstLink.textContent()
    expect(firstLinkText?.toLowerCase()).toContain('home')
  })

  test('@ready breadcrumb links are clickable', async ({ page }) => {
    await page.goto('/articles/typescript-best-practices')

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    const homeLink = breadcrumbs.locator('a').first()

    await homeLink.click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('localhost:4321/')
  })

  test('@ready current page is not a link', async ({ page }) => {
    await page.goto('/articles/typescript-best-practices')

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    const items = breadcrumbs.locator('li')
    const lastItem = items.last()

    // Last item should have aria-current="page" on the span, not be a link
    const currentPageSpan = lastItem.locator('span[aria-current="page"]')
    await expect(currentPageSpan).toBeVisible()

    // Verify no link in last item
    const linkCount = await lastItem.locator('a').count()
    expect(linkCount).toBe(0)
  })

  test('@ready breadcrumbs have proper separators', async ({ page }) => {
    await page.goto('/articles/typescript-best-practices')

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    const items = breadcrumbs.locator('li')

    const count = await items.count()
    expect(count).toBeGreaterThan(1)

    // Check for SVG separator icon
    const separators = breadcrumbs.locator('svg[aria-hidden="true"]')
    const separatorCount = await separators.count()
    expect(separatorCount).toBeGreaterThan(0)
  })

  test('@ready breadcrumbs use proper ARIA', async ({ page }) => {
    await page.goto('/articles/typescript-best-practices')

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbs).toBeVisible()

    // Should contain ordered list
    const list = breadcrumbs.locator('ol')
    await expect(list).toBeVisible()
  })

  test('@ready breadcrumbs are responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/articles/typescript-best-practices')

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumbs).toBeVisible()
  })

  test.skip('@wip breadcrumbs have structured data', async ({ page }) => {
    // Expected: Should include JSON-LD BreadcrumbList schema
    await page.goto('/articles/typescript-best-practices')

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents()
    const hasBreadcrumbSchema = jsonLd.some((json) => json.includes('BreadcrumbList'))

    expect(hasBreadcrumbSchema).toBe(true)
  })

  test('@ready breadcrumbs truncate long titles', async ({ page }) => {
    await page.goto('/articles/typescript-best-practices')

    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]')
    const lastItem = breadcrumbs.locator('li').last()

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
