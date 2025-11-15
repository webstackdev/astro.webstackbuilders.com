/**
 * Site-wide Smoke Tests
 * Tests for site-level functionality (RSS, manifest, 404 pages)
 */
import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Site-wide Features @smoke', () => {
  test('@ready 404 page displays for invalid routes', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/does-not-exist')
    expect(response?.status()).toBe(404)
    // Verify main content is visible
    await page.expectMainElement()
    await page.expectHeading()
  })

  test('@ready RSS feed is accessible', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // RSS feed should be accessible and valid XML
    const response = await page.goto('/rss.xml')
    expect(response?.status()).toBe(200)

    const contentType = response?.headers()['content-type']
    expect(contentType).toMatch(/xml/)

    // Get raw response text, not browser-rendered HTML
    const content = await response!.text()
    expect(content).toContain('<?xml')
    expect(content).toContain('<rss')
  })

  test('@ready manifest.json is accessible', async ({ request }) => {
    // PWA manifest should be accessible and valid JSON
    // Use request API instead of page.goto to avoid download issues in Firefox
    const response = await request.get('/manifest.json')
    expect(response.status()).toBe(200)

    const contentType = response.headers()['content-type']
    expect(contentType).toMatch(/json/)

    // Get response content
    const content = await response.text()
    const manifest = JSON.parse(content)

    // Verify required manifest fields
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBeTruthy()
    expect(manifest.icons).toBeTruthy()
    expect(Array.isArray(manifest.icons)).toBe(true)
  })

  test('@ready robots.txt is accessible', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // robots.txt should be accessible and contain directives
    const response = await page.goto('/robots.txt')
    expect(response?.status()).toBe(200)

    const contentType = response?.headers()['content-type']
    expect(contentType).toMatch(/text\/plain/)

    // Get raw response text
    const content = await response!.text()
    expect(content).toContain('User-agent:')
    expect(content).toContain('Sitemap:')
  })
})
