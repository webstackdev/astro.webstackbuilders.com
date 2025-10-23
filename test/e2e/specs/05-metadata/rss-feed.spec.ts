/**
 * RSS Feed Tests
 * Tests for RSS/Atom feed generation
 * @see src/pages/rss.xml.ts
 */

import { test, expect } from '@test/e2e/helpers'

test.describe('RSS Feed', () => {
  test.skip('@wip RSS feed is accessible', async ({ page }) => {
    // Expected: /rss.xml should return valid XML
    const response = await page.goto('/rss.xml')
    expect(response?.status()).toBe(200)

    const contentType = response?.headers()['content-type']
    expect(contentType).toMatch(/xml|rss/)
  })

  test.skip('@wip RSS feed is valid XML', async ({ page }) => {
    // Expected: Feed should be parseable XML
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    expect(xml).toContain('<?xml')
    expect(xml).toContain('<rss')
    expect(xml).toContain('</rss>')
  })

  test.skip('@wip RSS feed has channel element', async ({ page }) => {
    // Expected: Should have <channel> with title, link, description
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    expect(xml).toContain('<channel>')
    expect(xml).toContain('<title>')
    expect(xml).toContain('<link>')
    expect(xml).toContain('<description>')
  })

  test.skip('@wip RSS feed has items', async ({ page }) => {
    // Expected: Feed should contain article items
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    expect(xml).toContain('<item>')

    // Count items (rough estimate)
    const itemCount = (xml?.match(/<item>/g) || []).length
    expect(itemCount).toBeGreaterThan(0)
  })

  test.skip('@wip RSS items have required fields', async ({ page }) => {
    // Expected: Each item should have title, link, description, pubDate
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

  test.skip('@wip RSS feed is linked in HTML', async ({ page }) => {
    // Expected: HTML should have link to RSS feed
    await page.goto('/')

    const rssLink = page.locator('link[type="application/rss+xml"]')
    await expect(rssLink).toHaveCount(1)

    const href = await rssLink.getAttribute('href')
    expect(href).toContain('rss.xml')
  })

  test.skip('@wip RSS feed uses absolute URLs', async ({ page }) => {
    // Expected: All links should be absolute URLs
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    // Check that links are absolute
    const linkMatches = xml?.match(/<link>(.*?)<\/link>/g) || []
    for (const linkTag of linkMatches) {
      const url = linkTag.replace(/<\/?link>/g, '')
      expect(url).toMatch(/^https?:\/\//)
    }
  })

  test.skip('@wip RSS feed has valid pubDate format', async ({ page }) => {
    // Expected: pubDate should be RFC 822 format
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    const pubDateMatch = xml?.match(/<pubDate>(.*?)<\/pubDate>/)
    expect(pubDateMatch).toBeTruthy()

    const pubDate = pubDateMatch?.[1] || ''
    // RFC 822 format check (basic)
    expect(pubDate).toMatch(/\w{3}, \d{2} \w{3} \d{4}/)
  })

  test.skip('@wip RSS feed includes content', async ({ page }) => {
    // Expected: Items should have content or description
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    const hasContent =
      xml?.includes('<content:encoded>') ||
      xml?.includes('<description>') ||
      xml?.includes('<content>')

    expect(hasContent).toBe(true)
  })

  test.skip('@wip RSS feed has language specified', async ({ page }) => {
    // Expected: Should specify language in channel
    const response = await page.goto('/rss.xml')
    const xml = await response?.text()

    expect(xml).toContain('<language>')
  })
})
