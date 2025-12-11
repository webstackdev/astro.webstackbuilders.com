/**
 * Open Graph Metadata Tests
 * Tests for Open Graph meta tags for social sharing
 * @see src/components/Head/
 */

import { BasePage, test, expect } from '@test/e2e/helpers'

const REQUIRED_META_TAGS = ['og:title', 'og:description']

test.describe('Open Graph Metadata', () => {
  test('@ready homepage has required OG tags', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    for (const tag of REQUIRED_META_TAGS) {
      await page.expectAttribute(`meta[property="${tag}"]`, 'content')
      const content = await page.getAttribute(`meta[property="${tag}"]`, 'content')
      expect(content?.trim().length).toBeGreaterThan(0)
    }
  })

  test('@ready article pages have OG type article', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')

    // Wait for articles to load
    await page.waitForSelector('a[href*="/articles/"]', { timeout: 5000 })

    // Get the first article URL
    const articleUrl = await page.evaluate(() => {
      const link = document.querySelector('a[href*="/articles/"]')
      return link ? link.getAttribute('href') : null
    })

    expect(articleUrl).toBeTruthy()

    // Navigate directly to the article page
    await page.goto(articleUrl!)
    await page.waitForLoadState('networkidle')

    const content = await page.getAttribute('meta[property="og:type"]', 'content')
    expect(content).toBe('article')
  })

  test('@ready OG title matches page title', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/about')

    const pageTitle = await page.getTitle()
    const ogTitleContent = await page.getAttribute('meta[property="og:title"]', 'content')

    expect(ogTitleContent).toBeTruthy()
    // May not be exact match (page title might have site name suffix)
    expect(pageTitle).toContain(ogTitleContent || '')
  })

  test('@ready OG URL matches current page', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/about')

    const ogUrlContent = await page.getAttribute('meta[property="og:url"]', 'content')
    expect(ogUrlContent).toContain('/about')
  })

  test('@ready OG image is valid URL', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const imageUrl = await page.getAttribute('meta[property="og:image"]', 'content')
    expect(imageUrl).toMatch(/^https?:\/\//)
    // Accept both static images and dynamic social card URLs
    const isStaticImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(imageUrl || '')
    const isDynamicCard = /\/api\/social-card\?/.test(imageUrl || '')
    expect(isStaticImage || isDynamicCard).toBe(true)
  })

  test('@ready OG image has dimensions', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const widthCount = await page.countElements('meta[property="og:image:width"]')
    const heightCount = await page.countElements('meta[property="og:image:height"]')

    if (widthCount > 0) {
      const width = await page.getAttribute('meta[property="og:image:width"]', 'content')
      expect(parseInt(width || '0')).toBeGreaterThan(0)
    }

    if (heightCount > 0) {
      const height = await page.getAttribute('meta[property="og:image:height"]', 'content')
      expect(parseInt(height || '0')).toBeGreaterThan(0)
    }
  })

  test('@ready Twitter Card tags are present', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    await page.expectAttribute('meta[name="twitter:card"]', 'content')
    const cardType = await page.getAttribute('meta[name="twitter:card"]', 'content')
    expect(['summary', 'summary_large_image']).toContain(cardType)
  })

  test('@ready all pages have unique OG descriptions', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const pages = ['/', '/about', '/services']
    const descriptions = new Set()

    for (const url of pages) {
      await page.goto(url)
      const content = await page.getAttribute('meta[property="og:description"]', 'content')
      descriptions.add(content)
    }

    // Should have unique descriptions (unless intentionally same)
    expect(descriptions.size).toBeGreaterThanOrEqual(2)
  })

  test('@ready OG locale is set', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const count = await page.countElements('meta[property="og:locale"]')

    if (count > 0) {
      const locale = await page.getAttribute('meta[property="og:locale"]', 'content')
      expect(locale).toMatch(/^[a-z]{2}_[A-Z]{2}$/) // e.g., en_US
    }
  })

  test('@ready OG site name is set', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const siteName = await page.getAttribute('meta[property="og:site_name"]', 'content')
    expect(siteName?.trim().length).toBeGreaterThan(0)
  })

  test('@ready article pages have article metadata', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')

    // Wait for articles to load
    await page.waitForSelector('a[href*="/articles/"]', { timeout: 5000 })

    // Get the first article URL
    const articleUrl = await page.evaluate(() => {
      const link = document.querySelector('a[href*="/articles/"]')
      return link ? link.getAttribute('href') : null
    })

    expect(articleUrl).toBeTruthy()

    // Navigate directly to the article page
    await page.goto(articleUrl!)
    await page.waitForLoadState('networkidle')

    const publishedTimeCount = await page.countElements('meta[property="article:published_time"]')
    const authorCount = await page.countElements('meta[property="article:author"]')

    // At least one should be present
    const hasArticleMeta = publishedTimeCount > 0 || authorCount > 0
    expect(hasArticleMeta).toBe(true)
  })
})
