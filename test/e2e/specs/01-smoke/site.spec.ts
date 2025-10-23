/**
 * Site-wide Smoke Tests
 * Tests for site-level functionality (RSS, manifest, 404 pages)
 */
import { test, expect } from '@playwright/test'
import { TEST_URLS } from '@test/e2e/fixtures/test-data'

test.describe('Site-wide Features @smoke', () => {
  test('@ready 404 page displays for invalid routes', async ({ page }) => {
    await page.goto(TEST_URLS.notFound)

    // Should show 404 content
    await expect(page.locator('h1')).toContainText(/404|Not Found/i)
  })

  test('@ready RSS feed is accessible', async ({ page }) => {
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

  test('@ready manifest.json is accessible', async ({ page, request }) => {
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
})
