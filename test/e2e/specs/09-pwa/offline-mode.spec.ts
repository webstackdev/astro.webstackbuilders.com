/**
 * PWA Offline Mode Tests
 * Tests for Progressive Web App offline functionality
 * @see src/pages/offline/
 *
 * NOTE: Service worker tests are blocked because the PWA plugin is configured
 * with mode: 'production', which means service workers only register in production
 * builds, not in development or test environments.
 * @see src/lib/config/serviceWorker.ts
 */

import { test } from '@test/e2e/helpers'
import { PwaPage } from '@test/e2e/helpers/pageObjectModels/PwaPage'

test.describe('PWA Offline Mode', () => {
  test.skip('@blocked service worker registers successfully', async ({ page: playwrightPage }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    // BLOCKED: Service worker only registers in production mode
    // @see src/lib/config/serviceWorker.ts - mode: 'production'
    await pwaPage.navigateToHomeAndWaitForSW()
    await pwaPage.expectServiceWorkerRegistered()
  })

  test('@ready offline page is accessible', async ({ page: playwrightPage }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    await pwaPage.navigateToOfflinePage()
    await pwaPage.expectOfflineHeading()
  })

  test('@ready offline page displays appropriate message', async ({ page: playwrightPage }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    await pwaPage.navigateToOfflinePage()
    await pwaPage.expectOfflinePageMessage('offline')
  })

  test.skip('@blocked site works offline after initial visit', async ({ page: playwrightPage, context }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    // BLOCKED: Requires service worker to cache content
    // Service worker only works in production mode
    await pwaPage.navigateToHomeAndWaitForSW()

    // Go offline
    await pwaPage.goOffline(context)

    // Navigate to homepage again
    await pwaPage.goto('/')

    // Should show cached version or offline page
    await pwaPage.expectPageHasContent()
  })

  test.skip('@blocked service worker caches critical assets', async ({ page: playwrightPage }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    // BLOCKED: Service worker only works in production mode
    await pwaPage.navigateToHomeAndWaitForSW()
    await pwaPage.expectCachedAssets()
  })

  test.skip('@blocked offline fallback for dynamic content', async ({ page: playwrightPage, context }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    // BLOCKED: Requires service worker for offline fallback
    await pwaPage.navigateToHomeAndWaitForSW()

    await pwaPage.goOffline(context)

    // Try to navigate to articles that might not be cached
    const response = await pwaPage.page.goto('/articles').catch(() => null)

    // Should either show cached version or offline page
    if (response) {
      await pwaPage.expectPageHasContent()
    }
  })

  test('@ready online indicator updates correctly', async ({ page: playwrightPage, context }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    await pwaPage.goto('/')

    // Should be online initially
    await pwaPage.expectOnline()

    // Go offline
    await pwaPage.goOffline(context)

    // Check if page detected offline status
    await pwaPage.expectOffline()
  })

  test.skip('@blocked service worker updates when new version available', async ({ page: playwrightPage }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    // BLOCKED: Service worker only works in production mode
    await pwaPage.navigateToHomeAndWaitForSW()

    const swStatus = await pwaPage.updateServiceWorker()
    pwaPage.page.evaluate((status) => {
      if (status !== 'updated') {
        throw new Error(`Expected 'updated' but got '${status}'`)
      }
    }, swStatus)
  })

  test('@ready offline page has proper styling', async ({ page: playwrightPage }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    await pwaPage.navigateToOfflinePage()

    const hasStyles = await pwaPage.expectOfflinePageHasStyles()
    pwaPage.page.evaluate((styles) => {
      if (!styles) {
        throw new Error('Expected offline page to have styles')
      }
    }, hasStyles)
  })

  test.skip('@blocked service worker is activated', async ({ page: playwrightPage }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    // BLOCKED: Service worker only works in production mode
    await pwaPage.navigateToHomeAndWaitForSW()

    const swState = await pwaPage.getServiceWorkerState()
    pwaPage.page.evaluate((state) => {
      if (!state.active) {
        throw new Error('Expected service worker to be active')
      }
    }, swState)
  })
})

