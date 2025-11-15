/**
 * Regression Tests for Astro View Transitions - Meta Theme Color Persistence
 *
 * Verifies that the <meta name="theme-color"> element with transition:persist
 * maintains its DOM identity across page navigations when using Astro's View
 * Transitions API, while the <head> element itself is swapped out.
 *
 * Related:
 * - src/components/Head/Meta.astro (meta theme-color with transition:persist)
 * - src/components/scripts/store/themes.ts (theme color updates)
 * - Astro View Transitions API documentation
 */

import { ComponentPersistencePage, test, describe, expect } from '@test/e2e/helpers'

describe('View Transitions - transition:persist on meta theme-color', () => {
  test('should persist meta theme-color element across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = await ComponentPersistencePage.init(playwrightPage)

    await page.goto('/')

    // Set up test data on the meta theme-color element
    const initialData = await page.setupPersistenceTest('meta[name="theme-color"]')

    // Verify initial content is a valid hex color
    const initialContent = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]')
      return meta?.getAttribute('content')
    })

    expect(initialContent).toMatch(/^#[0-9a-fA-F]{6}$/)

    // Navigate to a different page using Astro's View Transitions
    await page.navigateToPage('/articles')
    await page.waitForURL('**/articles', { timeout: 5000 })

    // Verify the element persisted with the same DOM identity
    const afterNavigationData = await page.verifyPersistence('meta[name="theme-color"]')

    // Verify content is still a valid hex color after navigation
    const afterNavigationContent = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]')
      return meta?.getAttribute('content')
    })

    expect(afterNavigationContent).toMatch(/^#[0-9a-fA-F]{6}$/)

    // Run all persistence assertions
    page.assertPersistence(initialData, afterNavigationData)
  })

  test('should persist <head> element while preserving meta theme-color', async ({
    page: playwrightPage,
  }) => {
    const page = await ComponentPersistencePage.init(playwrightPage)
    await page.goto('/')

    // Mark the <head> element to verify it persists (Astro behavior)
    const headData = await page.evaluate(() => {
      const head = document.head
      const uniqueId = `head-test-${Date.now()}-${Math.random()}`

      // Set a custom property on the head element
      ;(head as any).__headTestId = uniqueId

      return {
        uniqueId,
        tagName: head.tagName.toLowerCase(),
      }
    })

    // Mark the meta element to verify it persists
    const metaData = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]')
      if (!meta) throw new Error('meta theme-color not found')

      const uniqueId = `meta-test-${Date.now()}-${Math.random()}`
      ;(meta as any).__metaTestId = uniqueId

      return {
        uniqueId,
        content: meta.getAttribute('content'),
      }
    })

    expect(metaData.content).toMatch(/^#[0-9a-fA-F]{6}$/)

    // Navigate using View Transitions
    await page.navigateToPage('/articles')
    await page.waitForURL('**/articles', { timeout: 5000 })

    // Check if head element persisted (Astro keeps the same head element)
    const afterNavigationHead = await page.evaluate(() => {
      const head = document.head
      return {
        headTestId: (head as any).__headTestId,
        tagName: head.tagName.toLowerCase(),
      }
    })

    // Astro View Transitions persists the <head> element itself
    // and selectively updates child elements as needed
    expect(afterNavigationHead.tagName).toBe('head')
    expect(afterNavigationHead.headTestId).toBe(headData.uniqueId)

    // Check if meta element persisted (should still have custom property)
    const afterNavigationMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]')
      if (!meta) throw new Error('meta theme-color not found after navigation')

      return {
        metaTestId: (meta as any).__metaTestId,
        content: meta.getAttribute('content'),
      }
    })

    // Meta should persist (custom property should still exist)
    expect(afterNavigationMeta.metaTestId).toBe(metaData.uniqueId)
    expect(afterNavigationMeta.content).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  test('should maintain theme-color content value across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = await ComponentPersistencePage.init(playwrightPage)
    await page.goto('/')

    // Get initial theme-color value
    const initialColor = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]')
      return meta?.getAttribute('content')
    })

    expect(initialColor).toMatch(/^#[0-9a-fA-F]{6}$/)

    // Navigate to another page
    await page.navigateToPage('/services')
    await page.waitForURL('**/services', { timeout: 5000 })

    // Get theme-color value after navigation
    const afterNavigationColor = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]')
      return meta?.getAttribute('content')
    })

    // Theme color should persist (same value)
    expect(afterNavigationColor).toBe(initialColor)
    expect(afterNavigationColor).toMatch(/^#[0-9a-fA-F]{6}$/)

    // Navigate back to home
    await page.navigateToPage('/')
    await page.waitForURL(/\/$/, { timeout: 5000 })

    // Verify theme-color is still the same
    const finalColor = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]')
      return meta?.getAttribute('content')
    })

    expect(finalColor).toBe(initialColor)
    expect(finalColor).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  test('should update link rel="canonical" href across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = await ComponentPersistencePage.init(playwrightPage)
    await page.goto('/')

    // Mark the canonical link element to check if it's replaced or just updated
    const initialData = await page.evaluate(() => {
      const link = document.querySelector('link[rel="canonical"]')
      if (!link) throw new Error('canonical link not found')

      const uniqueId = `canonical-test-${Date.now()}-${Math.random()}`
      ;(link as any).__canonicalTestId = uniqueId

      return {
        uniqueId,
        href: link.getAttribute('href'),
      }
    })

    expect(initialData.href).toBeTruthy()
    expect(initialData.href).toMatch(/\/$/)

    // Navigate to articles page
    await page.navigateToPage('/articles')
    await page.waitForURL('**/articles', { timeout: 5000 })

    // Check if element was replaced or just updated
    const afterNavigationData = await page.evaluate(() => {
      const link = document.querySelector('link[rel="canonical"]')
      if (!link) throw new Error('canonical link not found after navigation')

      return {
        canonicalTestId: (link as any).__canonicalTestId,
        href: link.getAttribute('href'),
      }
    })

    // Canonical should update to new page URL
    expect(afterNavigationData.href).toBeTruthy()
    expect(afterNavigationData.href).toMatch(/\/articles\/?$/)
    expect(afterNavigationData.href).not.toBe(initialData.href)

    // Check if element was replaced (testId should be undefined) or updated (testId should persist)
    if (afterNavigationData.canonicalTestId === initialData.uniqueId) {
      // Element was updated in place (same DOM node)
      console.log('✓ Canonical link element was UPDATED (same DOM node)')
    } else {
      // Element was replaced (new DOM node)
      console.log('✓ Canonical link element was REPLACED (new DOM node)')
      expect(afterNavigationData.canonicalTestId).toBeUndefined()
    }
  })

  test('should maintain link rel="sitemap" href across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = await ComponentPersistencePage.init(playwrightPage)
    await page.goto('/')

    // Get initial sitemap URL
    const initialSitemap = await page.evaluate(() => {
      const link = document.querySelector('link[rel="sitemap"]')
      return link?.getAttribute('href')
    })

    expect(initialSitemap).toBe('/sitemap-index.xml')

    // Navigate to services page
    await page.navigateToPage('/services')
    await page.waitForURL('**/services', { timeout: 5000 })

    // Get sitemap URL after navigation
    const afterNavigationSitemap = await page.evaluate(() => {
      const link = document.querySelector('link[rel="sitemap"]')
      return link?.getAttribute('href')
    })

    // Sitemap should remain the same
    expect(afterNavigationSitemap).toBe(initialSitemap)
    expect(afterNavigationSitemap).toBe('/sitemap-index.xml')
  })

  test('should maintain meta name="mobile-web-app-capable" across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = await ComponentPersistencePage.init(playwrightPage)
    await page.goto('/')

    // Get initial mobile-web-app-capable value
    const initialValue = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="mobile-web-app-capable"]')
      return meta?.getAttribute('content')
    })

    expect(initialValue).toBe('yes')

    // Navigate to case studies page
    await page.navigateToPage('/case-studies')
    await page.waitForURL('**/case-studies', { timeout: 5000 })

    // Get mobile-web-app-capable value after navigation
    const afterNavigationValue = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="mobile-web-app-capable"]')
      return meta?.getAttribute('content')
    })

    // Value should remain the same
    expect(afterNavigationValue).toBe(initialValue)
    expect(afterNavigationValue).toBe('yes')
  })
})
