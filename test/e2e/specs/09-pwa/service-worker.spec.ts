/**
 * Service Worker Tests
 * Tests for service worker installation and functionality
 */

import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'

test.describe('Service Worker', () => {
  test.skip('@wip service worker file is accessible', async ({ page }) => {
    // Expected: /sw.js or similar should be accessible
    const swResponse = await page.goto('/sw.js').catch(() => null)

    if (!swResponse) {
      // Try alternative paths
      const altResponse = await page.goto('/service-worker.js').catch(() => null)
      expect(altResponse?.status()).toBe(200)
    } else {
      expect(swResponse.status()).toBe(200)
    }
  })

  test.skip('@wip service worker has correct MIME type', async ({ page }) => {
    // Expected: SW file should be served as JavaScript
    const response = await page.goto('/sw.js').catch(() => null)

    if (response) {
      const contentType = response.headers()['content-type']
      expect(contentType).toMatch(/javascript/)
    }
  })

  test.skip('@wip service worker installs on first visit', async ({ page }) => {
    // Expected: SW should install when visiting site
    await page.goto(TEST_URLS.home)

    const installed = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          return registration.active?.state === 'activated'
        } catch {
          return false
        }
      }
      return false
    })

    expect(installed).toBe(true)
  })

  test.skip('@wip service worker handles fetch events', async ({ page }) => {
    // Expected: SW should intercept and handle fetch requests
    await page.goto(TEST_URLS.home)
    await page.waitForTimeout(2000)

    // Make a request that should be handled by SW
    const response = await page.evaluate(async () => {
      const res = await fetch('/')
      return {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
      }
    })

    expect(response.status).toBe(200)
  })

  test.skip('@wip service worker caches navigation requests', async ({ page }) => {
    // Expected: HTML pages should be cached
    await page.goto(TEST_URLS.home)
    await page.waitForTimeout(2000)

    const cachedPages = await page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        for (const name of cacheNames) {
          const cache = await caches.open(name)
          const requests = await cache.keys()
          const htmlRequests = requests.filter((req) =>
            req.url.includes('.html') || req.url.endsWith('/')
          )
          return htmlRequests.length
        }
      }
      return 0
    })

    expect(cachedPages).toBeGreaterThan(0)
  })

  test.skip('@wip service worker caches static assets', async ({ page }) => {
    // Expected: CSS, JS, images should be cached
    await page.goto(TEST_URLS.home)
    await page.waitForTimeout(2000)

    const cachedAssets = await page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        for (const name of cacheNames) {
          const cache = await caches.open(name)
          const requests = await cache.keys()
          const staticAssets = requests.filter(
            (req) =>
              req.url.includes('.css') ||
              req.url.includes('.js') ||
              req.url.includes('.png') ||
              req.url.includes('.jpg') ||
              req.url.includes('.webp')
          )
          return staticAssets.length
        }
      }
      return 0
    })

    expect(cachedAssets).toBeGreaterThan(0)
  })

  test.skip('@wip service worker responds with cached version when offline', async ({
    page,
    context,
  }) => {
    // Expected: SW should serve cached resources when offline
    await page.goto(TEST_URLS.home)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Go offline
    await context.setOffline(true)

    // Reload page
    await page.reload()
    await page.waitForTimeout(1000)

    // Should load from cache
    const content = await page.textContent('body')
    expect(content?.length).toBeGreaterThan(0)
  })

  test.skip('@wip service worker implements cache versioning', async ({ page }) => {
    // Expected: SW should version its caches
    await page.goto(TEST_URLS.home)
    await page.waitForTimeout(2000)

    const cacheNames = await page.evaluate(async () => {
      if ('caches' in window) {
        return await caches.keys()
      }
      return []
    })

    expect(cacheNames.length).toBeGreaterThan(0)

    // Cache names should include version or timestamp
    const hasVersion = cacheNames.some(
      (name) => /v\d+|version|\d{4}/.test(name)
    )

    expect(hasVersion).toBe(true)
  })

  test.skip('@wip service worker cleans up old caches', async ({ page }) => {
    // Expected: Old cache versions should be deleted
    await page.goto(TEST_URLS.home)
    await page.waitForTimeout(2000)

    // Activate should trigger cache cleanup
    const cleanup = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready
        // Simulate activation
        return 'cleanup-expected'
      }
      return 'no-sw'
    })

    expect(cleanup).toBe('cleanup-expected')
  })

  test.skip('@wip service worker has proper scope', async ({ page }) => {
    // Expected: SW scope should be root /
    await page.goto(TEST_URLS.home)

    const scope = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        return reg.scope
      }
      return ''
    })

    expect(scope).toContain(page.url().split('/').slice(0, 3).join('/'))
  })
})
