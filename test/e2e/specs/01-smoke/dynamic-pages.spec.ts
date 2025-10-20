/**
 * Dynamic Pages Smoke Test
 * Tests dynamically generated pages (articles, services, case studies)
 * Uses API to fetch actual content IDs to ensure tests work even if content changes
 */
import { test, expect } from '@playwright/test'

test.describe('Dynamic Pages @smoke', () => {
  test('@ready article detail page loads', async ({ page }) => {
    // First, visit articles list to get an actual article link
    await page.goto('/articles')
    await page.waitForLoadState('networkidle')

    // Find first article link
    const firstArticleLink = page.locator('a[href*="/articles/"]').first()
    await expect(firstArticleLink).toBeVisible()

    const articleUrl = await firstArticleLink.getAttribute('href')
    expect(articleUrl).toBeTruthy()

    // Navigate to the article
    await page.goto(articleUrl!)
    await page.waitForLoadState('networkidle')

    // Verify article page loaded with expected elements
    await expect(page.locator('article, main')).toBeVisible()
    await expect(page.locator('h1')).toBeVisible()

    // Verify we're on an article page (URL should match pattern)
    expect(page.url()).toMatch(/\/articles\/.+/)
  })

  test('@wip service detail page loads', async ({ page }) => {
    // Visit services list to get an actual service link
    await page.goto('/services')
    await page.waitForLoadState('networkidle')

    // Find first service link
    const firstServiceLink = page.locator('a[href*="/services/"]').first()
    const serviceUrl = await firstServiceLink.getAttribute('href')

    if (!serviceUrl) {
      test.skip()
      return
    }

    // Navigate to the service
    await page.goto(serviceUrl)
    await page.waitForLoadState('networkidle')

    // Verify service page loaded
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('h1')).toBeVisible()

    // Verify we're on a service page
    expect(page.url()).toMatch(/\/services\/.+/)
  })

  test('@wip case study detail page loads', async ({ page }) => {
    // Visit case studies list to get an actual case study link
    await page.goto('/case-studies')
    await page.waitForLoadState('networkidle')

    // Find first case study link
    const firstCaseStudyLink = page.locator('a[href*="/case-studies/"]').first()
    const caseStudyUrl = await firstCaseStudyLink.getAttribute('href')

    if (!caseStudyUrl) {
      test.skip()
      return
    }

    // Navigate to the case study
    await page.goto(caseStudyUrl)
    await page.waitForLoadState('networkidle')

    // Verify case study page loaded
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('h1')).toBeVisible()

    // Verify we're on a case study page
    expect(page.url()).toMatch(/\/case-studies\/.+/)
  })

  test('@ready RSS feed is accessible', async ({ page }) => {
    // RSS feed should be accessible and valid XML
    const response = await page.goto('/rss.xml')
    expect(response?.status()).toBe(200)

    const contentType = response?.headers()['content-type']
    expect(contentType).toMatch(/xml/)

    const content = await page.content()
    expect(content).toContain('<?xml')
    expect(content).toContain('<rss')
  })

  test('@ready manifest.json is accessible', async ({ page }) => {
    // PWA manifest should be accessible and valid JSON
    const response = await page.goto('/manifest.json')
    expect(response?.status()).toBe(200)

    const contentType = response?.headers()['content-type']
    expect(contentType).toMatch(/json/)

    const content = await page.content()
    const manifest = JSON.parse(content)

    // Verify required manifest fields
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBeTruthy()
    expect(manifest.icons).toBeTruthy()
    expect(Array.isArray(manifest.icons)).toBe(true)
  })
})
