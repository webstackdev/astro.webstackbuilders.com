/**
 * Open Graph Metadata Tests
 * Tests for Open Graph meta tags for social sharing
 * @see src/components/Head/
 */

import { test, expect } from '@test/e2e/helpers'
const REQUIRED_META_TAGS = ['description', 'og:title', 'og:description']

test.describe('Open Graph Metadata', () => {
  test.skip('@wip homepage has required OG tags', async ({ page }) => {
    // Expected: Homepage should have all required Open Graph tags
    await page.goto("/")

    for (const tag of REQUIRED_META_TAGS) {
      const meta = page.locator(`meta[property="${tag}"]`)
      await expect(meta).toHaveCount(1)

      const content = await meta.getAttribute('content')
      expect(content?.trim().length).toBeGreaterThan(0)
    }
  })

  test.skip('@wip article pages have OG type article', async ({ page }) => {
    // Expected: Article pages should have og:type="article"
    await page.goto("/articles")
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const ogType = page.locator('meta[property="og:type"]')
    const content = await ogType.getAttribute('content')

    expect(content).toBe('article')
  })

  test.skip('@wip OG title matches page title', async ({ page }) => {
    // Expected: og:title should match or be similar to <title>
    await page.goto("/about")

    const pageTitle = await page.title()
    const ogTitle = page.locator('meta[property="og:title"]')
    const ogTitleContent = await ogTitle.getAttribute('content')

    expect(ogTitleContent).toBeTruthy()
    // May not be exact match (page title might have site name suffix)
    expect(pageTitle).toContain(ogTitleContent || '')
  })

  test.skip('@wip OG URL matches current page', async ({ page }) => {
    // Expected: og:url should match the canonical URL
    await page.goto("/about")

    const ogUrl = page.locator('meta[property="og:url"]')
    const ogUrlContent = await ogUrl.getAttribute('content')

    expect(ogUrlContent).toContain('/about')
  })

  test.skip('@wip OG image is valid URL', async ({ page }) => {
    // Expected: og:image should be a full URL to an image
    await page.goto("/")

    const ogImage = page.locator('meta[property="og:image"]')
    const imageUrl = await ogImage.getAttribute('content')

    expect(imageUrl).toMatch(/^https?:\/\//)
    expect(imageUrl).toMatch(/\.(jpg|jpeg|png|webp|gif)$/i)
  })

  test.skip('@wip OG image has dimensions', async ({ page }) => {
    // Expected: Should have og:image:width and og:image:height
    await page.goto("/")

    const imageWidth = page.locator('meta[property="og:image:width"]')
    const imageHeight = page.locator('meta[property="og:image:height"]')

    const widthCount = await imageWidth.count()
    const heightCount = await imageHeight.count()

    if (widthCount > 0) {
      const width = await imageWidth.getAttribute('content')
      expect(parseInt(width || '0')).toBeGreaterThan(0)
    }

    if (heightCount > 0) {
      const height = await imageHeight.getAttribute('content')
      expect(parseInt(height || '0')).toBeGreaterThan(0)
    }
  })

  test.skip('@wip Twitter Card tags are present', async ({ page }) => {
    // Expected: Should have twitter:card meta tags
    await page.goto("/")

    const twitterCard = page.locator('meta[name="twitter:card"]')
    await expect(twitterCard).toHaveCount(1)

    const cardType = await twitterCard.getAttribute('content')
    expect(['summary', 'summary_large_image']).toContain(cardType)
  })

  test.skip('@wip Twitter title is present', async ({ page }) => {
    // Expected: Should have twitter:title
    await page.goto("/")

    const twitterTitle = page.locator('meta[name="twitter:title"]')
    const content = await twitterTitle.getAttribute('content')

    expect(content?.trim().length).toBeGreaterThan(0)
  })

  test.skip('@wip Twitter description is present', async ({ page }) => {
    // Expected: Should have twitter:description
    await page.goto("/")

    const twitterDesc = page.locator('meta[name="twitter:description"]')
    const content = await twitterDesc.getAttribute('content')

    expect(content?.trim().length).toBeGreaterThan(0)
  })

  test.skip('@wip Twitter image is present', async ({ page }) => {
    // Expected: Should have twitter:image
    await page.goto("/")

    const twitterImage = page.locator('meta[name="twitter:image"]')
    const imageUrl = await twitterImage.getAttribute('content')

    expect(imageUrl).toMatch(/^https?:\/\//)
  })

  test.skip('@wip all pages have unique OG descriptions', async ({ page }) => {
    // Expected: Each page should have unique description
    const pages = ["/", "/about", "/services"]
    const descriptions = new Set()

    for (const url of pages) {
      await page.goto(url)
      const ogDesc = page.locator('meta[property="og:description"]')
      const content = await ogDesc.getAttribute('content')
      descriptions.add(content)
    }

    // Should have unique descriptions (unless intentionally same)
    expect(descriptions.size).toBeGreaterThanOrEqual(2)
  })

  test.skip('@wip OG locale is set', async ({ page }) => {
    // Expected: Should have og:locale for language
    await page.goto("/")

    const ogLocale = page.locator('meta[property="og:locale"]')
    const count = await ogLocale.count()

    if (count > 0) {
      const locale = await ogLocale.getAttribute('content')
      expect(locale).toMatch(/^[a-z]{2}_[A-Z]{2}$/) // e.g., en_US
    }
  })

  test.skip('@wip OG site name is set', async ({ page }) => {
    // Expected: Should have og:site_name
    await page.goto("/")

    const ogSiteName = page.locator('meta[property="og:site_name"]')
    const siteName = await ogSiteName.getAttribute('content')

    expect(siteName?.trim().length).toBeGreaterThan(0)
  })

  test.skip('@wip article pages have article metadata', async ({ page }) => {
    // Expected: Article pages should have article:published_time, etc.
    await page.goto("/articles")
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const publishedTime = page.locator('meta[property="article:published_time"]')
    const author = page.locator('meta[property="article:author"]')

    // At least one should be present
    const hasArticleMeta = (await publishedTime.count()) > 0 || (await author.count()) > 0
    expect(hasArticleMeta).toBe(true)
  })
})
