/**
 * RSS Feed Tests
 * Tests for RSS/Atom feed generation
 * @see src/pages/rss.xml.ts
 */

import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('RSS Feed', () => {
  test('@ready RSS feed is accessible', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/rss.xml')
    expect(response?.status()).toBe(200)

    const contentType = response?.headers()['content-type']
    expect(contentType).toMatch(/xml|rss/)
  })

  test('@ready RSS feed is valid XML', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    expect(xml).toContain('<?xml')
    expect(xml).toContain('<rss')
    expect(xml).toContain('</rss>')
  })

  test('@ready RSS feed has channel element', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    expect(xml).toContain('<channel>')
    expect(xml).toContain('<title>')
    expect(xml).toContain('<link>')
    expect(xml).toContain('<description>')
  })

  test('@ready RSS feed has items', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    expect(xml).toContain('<item>')

    // Count items (rough estimate)
    const itemCount = (xml?.match(/<item>/g) || []).length
    expect(itemCount).toBeGreaterThan(0)
  })

  test('@ready RSS items have required fields', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    // Extract first item
    const itemMatch = xml?.match(/<item>[\s\S]*?<\/item>/)
    expect(itemMatch).toBeTruthy()

    const firstItem = itemMatch?.[0] || ''
    expect(firstItem).toContain('<title>')
    expect(firstItem).toContain('<link>')
    expect(firstItem).toContain('<description>')
    expect(firstItem).toContain('<pubDate>')
  })

  test('@ready RSS feed is linked in HTML', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    await page.expectAttribute('link[type="application/rss+xml"]', 'href')
    const href = await page.getAttribute('link[type="application/rss+xml"]', 'href')
    expect(href).toContain('rss.xml')
  })

  test('@ready RSS feed uses absolute URLs', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    // Check that links are absolute
    const linkMatches = xml?.match(/<link>(.*?)<\/link>/g) || []
    for (const linkTag of linkMatches) {
      const url = linkTag.replace(/<\/?link>/g, '')
      expect(url).toMatch(/^https?:\/\//)
    }
  })

  test('@ready RSS feed has valid pubDate format', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    const pubDateMatch = xml?.match(/<pubDate>(.*?)<\/pubDate>/)
    expect(pubDateMatch).toBeTruthy()

    const pubDate = pubDateMatch?.[1] || ''
    // RFC 822 format check (basic)
    expect(pubDate).toMatch(/\w{3}, \d{2} \w{3} \d{4}/)
  })

  test('@ready RSS feed includes content', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    const hasContent =
      xml?.includes('<content:encoded>') || xml?.includes('<description>') || xml?.includes('<content>')

    expect(hasContent).toBe(true)
  })

  test('@ready RSS feed has language specified', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    expect(xml).toContain('<language>')
  })
})
