/**
 * PWA Offline Mode Tests
 * Tests for Progressive Web App offline functionality
 * @see src/pages/offline/
 */

import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'

test.describe('PWA Offline Mode', () => {
  test.skip('@wip service worker registers successfully', async ({ page }) => {
    // Expected: Service worker should register on page load
    await page.goto(TEST_URLS.home)

    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        return registration !== null
      }
      return false
    })

    expect(swRegistered).toBe(true)
  })

  test.skip('@wip offline page is accessible', async ({ page }) => {
    // Expected: /offline page should load
    const response = await page.goto('/offline')
    expect(response?.status()).toBe(200)
  })

  test.skip('@wip offline page displays appropriate message', async ({ page }) => {
    // Expected: Offline page should explain the situation
    await page.goto('/offline')

    const content = await page.textContent('body')
    expect(content?.toLowerCase()).toContain('offline')
  })

  test.skip('@wip site works offline after initial visit', async ({ page, context }) => {
    // Expected: After visiting once, core pages should work offline
    await page.goto(TEST_URLS.home)
    await page.waitForLoadState('networkidle')

    // Wait for service worker to cache resources
    await page.waitForTimeout(2000)

    // Go offline
    await context.setOffline(true)

    // Navigate to homepage again
    await page.goto(TEST_URLS.home)

    // Should show cached version or offline page
    const content = await page.textContent('body')
    expect(content?.length).toBeGreaterThan(0)
  })

  test.skip('@wip service worker caches critical assets', async ({ page }) => {
    // Expected: SW should cache important resources
    await page.goto(TEST_URLS.home)
    await page.waitForTimeout(2000)

    const cachedAssets = await page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        const cache = await caches.open(cacheNames[0] || '')
        const cachedRequests = await cache.keys()
        return cachedRequests.length
      }
      return 0
    })

    expect(cachedAssets).toBeGreaterThan(0)
  })

  test.skip('@wip offline fallback for dynamic content', async ({ page, context }) => {
    // Expected: Dynamic pages should show offline message when unavailable
    await page.goto(TEST_URLS.home)
    await page.waitForTimeout(2000)

    await context.setOffline(true)

    // Try to navigate to article that might not be cached
    const response = await page.goto(TEST_URLS.articles).catch(() => null)

    // Should either show cached version or offline page
    if (response) {
      const status = response.status()
      expect([200, 304]).toContain(status)
    }
  })

  test.skip('@wip online indicator updates correctly', async ({ page, context }) => {
    // Expected: Site should detect online/offline status changes
    await page.goto(TEST_URLS.home)

    // Listen for online/offline events
    const onlineStatus = await page.evaluate(() => {
      return navigator.onLine
    })

    expect(onlineStatus).toBe(true)

    // Go offline
    await context.setOffline(true)

    // Check if page detected offline status
    const offlineStatus = await page.evaluate(() => {
      return navigator.onLine
    })

    expect(offlineStatus).toBe(false)
  })

  test.skip('@wip service worker updates when new version available', async ({ page }) => {
    // Expected: SW should update when site is updated
    await page.goto(TEST_URLS.home)

    const swStatus = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.update()
        return 'updated'
      }
      return 'no-sw'
    })

    expect(swStatus).toBe('updated')
  })

  test.skip('@wip offline page has proper styling', async ({ page }) => {
    // Expected: Offline page should be styled (CSS cached)
    await page.goto('/offline')

    const hasStyles = await page.evaluate(() => {
      const body = document.body
      const styles = window.getComputedStyle(body)
      return styles.backgroundColor !== 'rgba(0, 0, 0, 0)'
    })

    expect(hasStyles).toBe(true)
  })

  test.skip('@wip service worker skip waiting', async ({ page }) => {
    // Expected: New SW should activate without waiting for tabs to close
    await page.goto(TEST_URLS.home)

    const swBehavior = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        return {
          active: registration.active !== null,
          waiting: registration.waiting !== null,
        }
      }
      return { active: false, waiting: false }
    })

    expect(swBehavior.active).toBe(true)
  })
})
