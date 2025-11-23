/**
 * PWA Manifest Tests
 * Tests for Web App Manifest
 * @see public/manifest.json
 */

import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('PWA Manifest', () => {
  // Skip Firefox tests as it downloads manifest.json instead of loading it as page content
  test.skip(({ browserName }) => browserName === 'firefox', 'Firefox downloads manifest.json instead of loading it')

  test('@ready manifest file is accessible', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/manifest.json')
    expect(response?.status()).toBe(200)

    const contentType = response?.headers()['content-type']
    expect(contentType).toContain('application/manifest+json')
  })

  test('@ready manifest is linked in HTML', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    await page.expectAttribute('link[rel="manifest"]', 'href')
    const href = await page.getAttribute('link[rel="manifest"]', 'href')
    expect(href).toContain('manifest.json')
  })

  test('@ready manifest has required fields', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBeTruthy()
    expect(manifest.display).toBeTruthy()
    expect(manifest.icons).toBeTruthy()
  })

  test('@ready manifest has multiple icon sizes', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThan(0)

    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })

  test('@ready manifest icons exist', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    for (const icon of manifest.icons) {
      const iconResponse = await page.goto(icon.src)
      expect(iconResponse?.status()).toBe(200)
    }
  })

  test('@ready manifest has theme color', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    expect(manifest.theme_color).toBeTruthy()
    expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  test('@ready manifest has background color', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    expect(manifest.background_color).toBeTruthy()
    expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  test('@ready manifest display mode is appropriate', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    expect(['standalone', 'fullscreen', 'minimal-ui', 'browser']).toContain(manifest.display)
  })

  test('@ready manifest has description', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    expect(manifest.description).toBeTruthy()
    expect(manifest.description.length).toBeGreaterThan(0)
  })

  test('@ready manifest theme color matches meta tag', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const manifestResponse = await page.goto('/manifest.json')
    const manifest = await manifestResponse?.json()

    await page.goto('/')
    const metaContent = await page.getAttribute('meta[name="theme-color"]', 'content')

    expect(manifest.theme_color).toBe(metaContent)
  })
})
