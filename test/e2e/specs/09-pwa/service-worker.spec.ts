/**
 * Service Worker Tests
 * Tests for service worker installation and functionality
 *
 * NOTE: All service worker tests are blocked because the PWA plugin is configured
 * with mode: 'production', which means service workers only register in production
 * builds, not in development or test environments.
 * @see src/lib/config/serviceWorker.ts
 *
 * To test service workers properly, you would need to:
 * 1. Build the production version: npm run build
 * 2. Serve the production build: npm run preview
 * 3. Run E2E tests against the preview server
 */

import { test } from '@test/e2e/helpers'
import { PwaPage } from '@test/e2e/helpers/pageObjectModels/PwaPage'

test.describe('Service Worker', () => {
  test.skip('@blocked service worker installs on first visit', async ({ page: playwrightPage }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    // BLOCKED: Service worker only registers in production mode
    await pwaPage.navigateToHomeAndWaitForSW()
    await pwaPage.expectServiceWorkerActivated()
  })

  test.skip('@blocked service worker caches navigation requests', async ({ page: playwrightPage }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    // BLOCKED: Service worker only works in production mode
    await pwaPage.navigateToHomeAndWaitForSW()
    await pwaPage.expectCachedPages()
  })

  test.skip('@blocked service worker caches static assets', async ({ page: playwrightPage }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    // BLOCKED: Service worker only works in production mode
    await pwaPage.navigateToHomeAndWaitForSW()
    await pwaPage.expectCachedStaticAssets()
  })

  test.skip('@blocked service worker responds with cached version when offline', async ({ page: playwrightPage, context }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    // BLOCKED: Service worker only works in production mode
    await pwaPage.navigateToHomeAndWaitForSW()

    // Go offline
    await pwaPage.goOffline(context)

    // Reload page
    await pwaPage.page.reload()
    await pwaPage.waitForLoadState('networkidle')
    await pwaPage.waitForServiceWorkerReady()

    // Should load from cache
    await pwaPage.expectPageHasContent()
  })

  test.skip('@blocked service worker implements cache versioning', async ({ page: playwrightPage }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    // BLOCKED: Service worker only works in production mode
    await pwaPage.navigateToHomeAndWaitForSW()
    await pwaPage.expectCacheVersioning()
  })

  test.skip('@blocked service worker has proper scope', async ({ page: playwrightPage }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    // BLOCKED: Service worker only works in production mode
    await pwaPage.navigateToHomeAndWaitForSW()
    const baseUrl = pwaPage.page.url().split('/').slice(0, 3).join('/')
    await pwaPage.expectServiceWorkerScope(baseUrl)
  })
})

