/**
 * PWA Manifest Tests
 * Tests for Web App Manifest
 * @see public/manifest.json
 */

import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'

test.describe('PWA Manifest', () => {
  test.skip('@wip manifest file is accessible', async ({ page }) => {
    // Expected: /manifest.json should return valid JSON
    const response = await page.goto('/manifest.json')
    expect(response?.status()).toBe(200)

    const contentType = response?.headers()['content-type']
    expect(contentType).toContain('application/json')
  })

  test.skip('@wip manifest is linked in HTML', async ({ page }) => {
    // Expected: HTML should have link to manifest
    await page.goto(TEST_URLS.home)

    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveCount(1)

    const href = await manifestLink.getAttribute('href')
    expect(href).toContain('manifest.json')
  })

  test.skip('@wip manifest has required fields', async ({ page }) => {
    // Expected: Manifest should have name, short_name, icons, etc.
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBeTruthy()
    expect(manifest.display).toBeTruthy()
    expect(manifest.icons).toBeTruthy()
  })

  test.skip('@wip manifest has multiple icon sizes', async ({ page }) => {
    // Expected: Should have icons for different sizes (192, 512, etc.)
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThan(0)

    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })

  test.skip('@wip manifest icons exist', async ({ page }) => {
    // Expected: Icon files referenced in manifest should exist
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    for (const icon of manifest.icons) {
      const iconResponse = await page.goto(icon.src)
      expect(iconResponse?.status()).toBe(200)
    }
  })

  test.skip('@wip manifest has theme color', async ({ page }) => {
    // Expected: Should specify theme_color
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    expect(manifest.theme_color).toBeTruthy()
    expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  test.skip('@wip manifest has background color', async ({ page }) => {
    // Expected: Should specify background_color
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    expect(manifest.background_color).toBeTruthy()
    expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  test.skip('@wip manifest display mode is appropriate', async ({ page }) => {
    // Expected: Display should be standalone, fullscreen, or minimal-ui
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    expect(['standalone', 'fullscreen', 'minimal-ui', 'browser']).toContain(manifest.display)
  })

  test.skip('@wip manifest has description', async ({ page }) => {
    // Expected: Should have description field
    const response = await page.goto('/manifest.json')
    const manifest = await response?.json()

    expect(manifest.description).toBeTruthy()
    expect(manifest.description.length).toBeGreaterThan(0)
  })

  test.skip('@wip manifest theme color matches meta tag', async ({ page }) => {
    // Expected: theme_color should match HTML meta tag
    const manifestResponse = await page.goto('/manifest.json')
    const manifest = await manifestResponse?.json()

    await page.goto(TEST_URLS.home)
    const themeColorMeta = page.locator('meta[name="theme-color"]')
    const metaContent = await themeColorMeta.getAttribute('content')

    expect(manifest.theme_color).toBe(metaContent)
  })
})
