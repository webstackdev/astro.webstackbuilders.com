/**
 * Service Worker Tests
 * Validates service worker registration, caching, and offline fallbacks.
 */

import { expect, test } from '@test/e2e/helpers'
import { PwaPage } from '@test/e2e/helpers/pageObjectModels/PwaPage'

test.describe('Service Worker', () => {
  test('@ready service worker registers and activates', async ({ page: playwrightPage }) => {
    const pwaPage: PwaPage = await PwaPage.init(playwrightPage)
    await pwaPage.navigateToHomeAndWaitForSW()

    await pwaPage.expectServiceWorkerRegistered()
    await pwaPage.expectServiceWorkerActivated()
  })

  test('@ready service worker populates caches after first run', async ({ page: playwrightPage }) => {
    const pwaPage: PwaPage = await PwaPage.init(playwrightPage)
    await pwaPage.navigateToHomeAndWaitForSW()

    const cachedAssets = await pwaPage.getCachedAssetsCount()
    expect(cachedAssets).toBeGreaterThan(0)
    await pwaPage.expectCacheVersioning()
  })

  test('@ready offline navigation falls back to 404 page', async ({ page: playwrightPage, context, browserName }) => {
    test.skip(browserName === 'webkit', 'Playwright WebKit cannot perform navigation requests while offline')

    const pwaPage: PwaPage = await PwaPage.init(playwrightPage)
    await pwaPage.navigateToHomeAndWaitForSW()

    await pwaPage.goOffline(context)
    try {
      const response = await pwaPage.goto('/definitely-not-real')
      expect(response).not.toBeNull()
      await pwaPage.expectNotFoundFallback()
    } finally {
      await pwaPage.goOnline(context)
    }
  })
})

