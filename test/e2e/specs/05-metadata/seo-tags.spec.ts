/**
 * SEO Meta Tags Tests
 * Tests for SEO-related meta tags including descriptions, keywords, and canonical URLs
 * @see src/components/Head/
 */

import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'

test.describe('SEO Meta Tags', () => {
  test.skip('@wip all pages have meta description', async ({ page }) => {
    // Expected: Every page should have a meta description
    const pages = [
      TEST_URLS.home,
      TEST_URLS.about,
      TEST_URLS.services,
      TEST_URLS.caseStudies,
      TEST_URLS.contact,
    ]

    for (const url of pages) {
      await page.goto(url)
      const metaDesc = page.locator('meta[name="description"]')
      await expect(metaDesc).toHaveCount(1)

      const content = await metaDesc.getAttribute('content')
      expect(content?.trim().length).toBeGreaterThan(0)
      expect(content?.length).toBeLessThan(160) // SEO best practice
    }
  })

  test.skip('@wip meta descriptions are unique per page', async ({ page }) => {
    // Expected: Each page should have unique description
    const pages = [TEST_URLS.home, TEST_URLS.about, TEST_URLS.services]
    const descriptions = new Set()

    for (const url of pages) {
      await page.goto(url)
      const metaDesc = page.locator('meta[name="description"]')
      const content = await metaDesc.getAttribute('content')
      descriptions.add(content)
    }

    expect(descriptions.size).toBe(pages.length)
  })

  test.skip('@wip all pages have canonical URL', async ({ page }) => {
    // Expected: Every page should have a canonical link
    await page.goto(TEST_URLS.about)

    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveCount(1)

    const href = await canonical.getAttribute('href')
    expect(href).toMatch(/^https?:\/\//)
  })

  test.skip('@wip canonical URL matches current page', async ({ page }) => {
    // Expected: Canonical should match the actual URL (without query params)
    await page.goto(TEST_URLS.services)

    const canonical = page.locator('link[rel="canonical"]')
    const href = await canonical.getAttribute('href')

    expect(href).toContain('/services')
  })

  test.skip('@wip pages have viewport meta tag', async ({ page }) => {
    // Expected: Should have responsive viewport meta tag
    await page.goto(TEST_URLS.home)

    const viewport = page.locator('meta[name="viewport"]')
    await expect(viewport).toHaveCount(1)

    const content = await viewport.getAttribute('content')
    expect(content).toContain('width=device-width')
  })

  test.skip('@wip pages have charset meta tag', async ({ page }) => {
    // Expected: Should declare UTF-8 charset
    await page.goto(TEST_URLS.home)

    const charset = page.locator('meta[charset], meta[http-equiv="Content-Type"]')
    const count = await charset.count()

    expect(count).toBeGreaterThan(0)
  })

  test.skip('@wip pages have robots meta tag', async ({ page }) => {
    // Expected: Should have robots meta tag for indexing control
    await page.goto(TEST_URLS.home)

    const robots = page.locator('meta[name="robots"]')
    const count = await robots.count()

    if (count > 0) {
      const content = await robots.getAttribute('content')
      expect(['index, follow', 'all', 'noindex']).toContain(content || '')
    }
  })

  test.skip('@wip 404 page has noindex', async ({ page }) => {
    // Expected: 404 page should not be indexed
    await page.goto(TEST_URLS.notFound)

    const robots = page.locator('meta[name="robots"]')
    const content = await robots.getAttribute('content')

    expect(content).toContain('noindex')
  })

  test.skip('@wip pages have author meta tag', async ({ page }) => {
    // Expected: Should declare site author
    await page.goto(TEST_URLS.home)

    const author = page.locator('meta[name="author"]')
    const count = await author.count()

    if (count > 0) {
      const content = await author.getAttribute('content')
      expect(content?.trim().length).toBeGreaterThan(0)
    }
  })

  test.skip('@wip article pages have author', async ({ page }) => {
    // Expected: Articles should have author meta tag
    await page.goto(TEST_URLS.articles)
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const author = page.locator('meta[name="author"]')
    const content = await author.getAttribute('content')

    expect(content?.trim().length).toBeGreaterThan(0)
  })

  test.skip('@wip pages have theme-color meta tag', async ({ page }) => {
    // Expected: Should have theme color for mobile browsers
    await page.goto(TEST_URLS.home)

    const themeColor = page.locator('meta[name="theme-color"]')
    const count = await themeColor.count()

    if (count > 0) {
      const content = await themeColor.getAttribute('content')
      expect(content).toMatch(/^#[0-9a-fA-F]{6}$/) // Hex color
    }
  })

  test.skip('@wip pages have title tag', async ({ page }) => {
    // Expected: Every page should have a title
    const pages = [TEST_URLS.home, TEST_URLS.about, TEST_URLS.services]

    for (const url of pages) {
      await page.goto(url)
      const title = await page.title()

      expect(title.length).toBeGreaterThan(0)
      expect(title.length).toBeLessThan(70) // SEO best practice
    }
  })

  test.skip('@wip titles are unique per page', async ({ page }) => {
    // Expected: Each page should have unique title
    const pages = [TEST_URLS.home, TEST_URLS.about, TEST_URLS.services]
    const titles = new Set()

    for (const url of pages) {
      await page.goto(url)
      const title = await page.title()
      titles.add(title)
    }

    expect(titles.size).toBe(pages.length)
  })

  test.skip('@wip pages have language attribute', async ({ page }) => {
    // Expected: HTML tag should have lang attribute
    await page.goto(TEST_URLS.home)

    const html = page.locator('html')
    const lang = await html.getAttribute('lang')

    expect(lang).toBeTruthy()
    expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/) // e.g., en or en-US
  })
})
