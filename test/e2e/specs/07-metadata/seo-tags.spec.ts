/**
 * SEO Meta Tags Tests
 * Tests for SEO-related meta tags including descriptions, keywords, and canonical URLs
 * @see src/components/Head/
 */

import { BasePage, test, expect } from '@test/e2e/helpers'
import { wait } from '@test/e2e/helpers/waitTimeouts'

test.describe('SEO Meta Tags', () => {
  test('@ready all pages have meta description', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    test.slow()
    const pages = ['/', '/about', '/services', '/case-studies', '/contact']

    for (const url of pages) {
      await page.goto(url, { timeout: wait.slowNavigation })
      await page.expectAttribute('meta[name="description"]', 'content')

      const content = await page.getAttribute('meta[name="description"]', 'content')
      expect(content?.trim().length).toBeGreaterThan(0)
      expect(content?.length).toBeLessThan(160) // SEO best practice
    }
  })

  test('@ready meta descriptions are unique per page', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const pages = ['/', '/about', '/services']
    const descriptions = new Set()

    for (const url of pages) {
      await page.goto(url)
      const content = await page.getAttribute('meta[name="description"]', 'content')
      descriptions.add(content)
    }

    expect(descriptions.size).toBe(pages.length)
  })

  test('@ready favicons are linked and assets are valid', async ({ page: playwrightPage, request }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    await page.expectAttribute('link[rel="icon"][href="/favicon.ico"]', 'href')
    await page.expectAttribute('link[rel="icon"][type="image/svg+xml"]', 'href')

    const assets = [
      { href: '/favicon.ico', pattern: /(image\/x-icon|image\/vnd\.microsoft\.icon)/ },
      { href: '/favicon.svg', pattern: /image\/svg\+xml/ },
    ]

    for (const asset of assets) {
      const response = await request.get(asset.href)
      expect(response.ok()).toBeTruthy()
      const contentType = response.headers()['content-type'] || ''
      expect(contentType).toMatch(asset.pattern)
      const body = await response.body()
      expect(body.byteLength).toBeGreaterThan(0)
    }
  })

  test('@ready apple-touch icon link stays in place', async ({ page: playwrightPage, request }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    await page.expectAttribute('link[rel="apple-touch-icon"]', 'href')
    const href = await page.getAttribute('link[rel="apple-touch-icon"]', 'href')
    expect(href).toBeTruthy()

    const assetUrl = href && href.startsWith('http')
      ? href
      : new URL(href ?? '/apple-touch-icon.png', page.page.url()).toString()

    const response = await request.get(assetUrl)
    expect(response.ok()).toBeTruthy()
    const contentType = response.headers()['content-type'] || ''
    expect(contentType).toMatch(/image\/png/)
    const body = await response.body()
    expect(body.byteLength).toBeGreaterThan(0)
  })

  test('@ready all pages have canonical URL', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/about')

    await page.expectAttribute('link[rel="canonical"]', 'href')
    const href = await page.getAttribute('link[rel="canonical"]', 'href')
    expect(href).toMatch(/^https?:\/\//)
  })

  test('@ready canonical URL matches current page', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')

    const href = await page.getAttribute('link[rel="canonical"]', 'href')
    expect(href).toContain('/services')
  })

  test('@ready pages have viewport meta tag', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    await page.expectAttribute('meta[name="viewport"]', 'content')
    const content = await page.getAttribute('meta[name="viewport"]', 'content')
    expect(content).toContain('width=device-width')
  })

  test('@ready pages have charset meta tag', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const count = await page.countElements('meta[charset], meta[http-equiv="Content-Type"]')
    expect(count).toBeGreaterThan(0)
  })

  test('@ready pages have robots meta tag', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const count = await page.countElements('meta[name="robots"]')

    if (count > 0) {
      const content = await page.getAttribute('meta[name="robots"]', 'content')
      expect(['index, follow', 'all', 'noindex']).toContain(content || '')
    }
  })

  test('@ready 404 page has noindex', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/404')

    const content = await page.getAttribute('meta[name="robots"]', 'content')
    expect(content).toContain('noindex')
  })

  test('@ready pages have author meta tag', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const count = await page.countElements('meta[name="author"]')

    if (count > 0) {
      const content = await page.getAttribute('meta[name="author"]', 'content')
      expect(content?.trim().length).toBeGreaterThan(0)
    }
  })

  test('@ready article pages have author', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    await page.click('a[href*="/articles/"]')
    // NOTE: Avoid strict 'networkidle' gating on WebKit/mobile-safari (can hang on long-lived requests).
    await page.waitForNetworkIdleBestEffort()

    const content = await page.getAttribute('meta[name="author"]', 'content')
    expect(content?.trim().length).toBeGreaterThan(0)
  })

  test('@ready pages have title tag', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const pages = ['/', '/about', '/services']

    for (const url of pages) {
      await page.goto(url)
      const title = await page.getTitle()

      expect(title.length).toBeGreaterThan(0)
      expect(title.length).toBeLessThan(70) // SEO best practice
    }
  })

  test('@ready titles are unique per page', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const pages = ['/', '/about', '/services']
    const titles = new Set()

    for (const url of pages) {
      await page.goto(url)
      const title = await page.getTitle()
      titles.add(title)
    }

    expect(titles.size).toBe(pages.length)
  })

  test('@ready pages have language attribute', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    // NOTE: Prefer 'domcontentloaded' over 'networkidle' for WebKit/mobile-safari reliability.
    await page.waitForLoadState('domcontentloaded')

    const lang = await playwrightPage.evaluate(() => document.documentElement.getAttribute('lang'))
    expect(lang).toBeTruthy()
    expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/) // e.g., en or en-US
  })
})
