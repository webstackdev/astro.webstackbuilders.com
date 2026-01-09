/**
 * PWA Page Object Model
 * Methods for testing Progressive Web App functionality
 */
import type { BrowserContext, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { BasePage } from '@test/e2e/helpers'

export class PwaPage extends BasePage {
  protected constructor(page: Page) {
    super(page)
  }

  static override async init(page: Page): Promise<PwaPage> {
    await this.setupPlaywrightGlobals(page)
    const instance = new PwaPage(page)
    await instance.onInit()
    return instance
  }

  /**
   * ================================================================
   * Navigation Methods
   * ================================================================
   */

  /**
   * Navigate to home page and wait for service worker
   */
  async navigateToHomeAndWaitForSW(): Promise<void> {
    await this.goto('/')
    // NOTE: Avoid strict 'networkidle' gating on WebKit/mobile-safari (can hang on long-lived requests).
    await this.waitForNetworkIdleBestEffort()
    await this.waitForServiceWorkerReady()
  }

  /**
   * ================================================================
   * Service Worker Methods
   * ================================================================
   */

  /**
   * Check if service worker is supported
   */
  async isServiceWorkerSupported(): Promise<boolean> {
    return await this.page.evaluate(() => 'serviceWorker' in navigator)
  }

  /**
   * Check if service worker is registered
   */
  async isServiceWorkerRegistered(): Promise<boolean> {
    return await this.page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          return registration !== null
        } catch {
          return false
        }
      }
      return false
    })
  }

  /**
   * Wait until the service worker is ready (registered + activated)
   */
  async waitForServiceWorkerReady(): Promise<void> {
    const attempts = 3

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        await this.page.evaluate(async () => {
          if (!('serviceWorker' in navigator)) {
            return
          }

          try {
            await navigator.serviceWorker.ready
          } catch {
            // ignore readiness errors in environments without SW support
          }
        })
        return
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        const contextDestroyed = message.includes('Execution context was destroyed')

        if (!contextDestroyed || attempt === attempts - 1) {
          throw error
        }

        // NOTE: Avoid strict 'networkidle' gating on WebKit/mobile-safari (can hang on long-lived requests).
        await this.waitForNetworkIdleBestEffort()
      }
    }
  }

  /**
   * Check if service worker is activated
   */
  async isServiceWorkerActivated(): Promise<boolean> {
    return await this.page.evaluate(async () => {
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
  }

  /**
   * Get service worker scope
   */
  async getServiceWorkerScope(): Promise<string> {
    return await this.page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        return registration.scope
      }
      return ''
    })
  }

  /**
   * Get service worker state
   */
  async getServiceWorkerState(): Promise<{
    active: boolean
    waiting: boolean
  }> {
    return await this.page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        return {
          active: registration.active !== null,
          waiting: registration.waiting !== null,
        }
      }
      return { active: false, waiting: false }
    })
  }

  /**
   * Trigger service worker update
   */
  async updateServiceWorker(): Promise<string> {
    return await this.page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.update()
        return 'updated'
      }
      return 'no-sw'
    })
  }

  /**
   * ================================================================
   * Cache Methods
   * ================================================================
   */

  /**
   * Get count of cached assets
   */
  async getCachedAssetsCount(): Promise<number> {
    return await this.page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        if (cacheNames.length === 0) return 0

        const cache = await caches.open(cacheNames[0]!)
        const cachedRequests = await cache.keys()
        return cachedRequests.length
      }
      return 0
    })
  }

  /**
   * Get all cache names
   */
  async getCacheNames(): Promise<string[]> {
    return await this.page.evaluate(async () => {
      if ('caches' in window) {
        return await caches.keys()
      }
      return []
    })
  }

  /**
   * Count cached navigation requests (HTML pages)
   */
  async getCachedPagesCount(): Promise<number> {
    return await this.page.evaluate(async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        for (const name of cacheNames) {
          const cache = await caches.open(name)
          const requests = await cache.keys()
          const htmlRequests = requests.filter(
            (req) => req.url.includes('.html') || req.url.endsWith('/')
          )
          return htmlRequests.length
        }
      }
      return 0
    })
  }

  /**
   * Count cached static assets (CSS, JS, images)
   */
  async getCachedStaticAssetsCount(): Promise<number> {
    return await this.page.evaluate(async () => {
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
              req.url.includes('.webp') ||
              req.url.includes('.svg') ||
              req.url.includes('.woff2')
          )
          return staticAssets.length
        }
      }
      return 0
    })
  }

  /**
   * ================================================================
   * Network Methods
   * ================================================================
   */

  /**
   * Go offline
   */
  async goOffline(context: BrowserContext): Promise<void> {
    await context.setOffline(true)
  }

  /**
   * Go online
   */
  async goOnline(context: BrowserContext): Promise<void> {
    await context.setOffline(false)
  }

  /**
   * Check if browser is online
   */
  async isOnline(): Promise<boolean> {
    return await this.page.evaluate(() => navigator.onLine)
  }

  /**
   * ================================================================
   * Assertion Methods
   * ================================================================
   */

  /**
   * Expect service worker to be registered
   */
  async expectServiceWorkerRegistered(): Promise<void> {
    const registered = await this.isServiceWorkerRegistered()
    expect(registered).toBe(true)
  }

  /**
   * Expect service worker to be activated
   */
  async expectServiceWorkerActivated(): Promise<void> {
    const activated = await this.isServiceWorkerActivated()
    expect(activated).toBe(true)
  }

  /**
   * Expect cached assets to exist
   */
  async expectCachedAssets(): Promise<void> {
    const count = await this.getCachedAssetsCount()
    expect(count).toBeGreaterThan(0)
  }

  /**
   * Expect cached pages to exist
   */
  async expectCachedPages(): Promise<void> {
    const count = await this.getCachedPagesCount()
    expect(count).toBeGreaterThan(0)
  }

  /**
   * Expect cached static assets to exist
   */
  async expectCachedStaticAssets(): Promise<void> {
    const count = await this.getCachedStaticAssetsCount()
    expect(count).toBeGreaterThan(0)
  }

  /**
   * Expect cache names to include version
   */
  async expectCacheVersioning(): Promise<void> {
    const cacheNames = await this.getCacheNames()
    expect(cacheNames.length).toBeGreaterThan(0)

    // Cache names should include version or timestamp
    const hasVersion = cacheNames.some((name) => /v\d+|version|\d{4}|webstackbuilders/.test(name))
    expect(hasVersion).toBe(true)
  }

  /**
   * Expect page to load with content (from cache or network)
   */
  async expectPageHasContent(): Promise<void> {
    const content = await this.getTextContent('body')
    expect(content?.length).toBeGreaterThan(0)
  }

  /**
   * Expect offline fallback content to be visible
   */
  async expectOfflineFallbackContent(): Promise<void> {
    await expect(this.page.getByText('You are offline')).toBeVisible()
    await expect(this.page.getByText('Try again when you reconnect')).toBeVisible()
  }

  /**
   * Expect 404 fallback to render when offline navigation fails
   */
  async expectNotFoundFallback(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible()
    await expect(this.page.getByRole('heading', { name: '404' })).toBeVisible()
  }

  /**
   * Expect service worker scope to match expected
   */
  async expectServiceWorkerScope(expectedScope: string): Promise<void> {
    const scope = await this.getServiceWorkerScope()
    expect(scope).toContain(expectedScope)
  }

  /**
   * Expect browser to be online
   */
  async expectOnline(): Promise<void> {
    const online = await this.isOnline()
    expect(online).toBe(true)
  }

  /**
   * Expect browser to be offline
   */
  async expectOffline(): Promise<void> {
    const offline = await this.isOnline()
    expect(offline).toBe(false)
  }
}
