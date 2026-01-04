/**
 * PWA Offline Mode Tests
 * Exercises the client-side online indicator behavior. Service worker specific cases
 * remain blocked because the plugin only registers service workers in production builds.
 */

import { test } from '@test/e2e/helpers'
import { PwaPage } from '@test/e2e/helpers/pageObjectModels/PwaPage'

test.describe('PWA Offline Mode', () => {
  test('@ready online indicator updates correctly', async ({ page: playwrightPage, context }) => {
    const pwaPage = await PwaPage.init(playwrightPage)
    await pwaPage.goto('/')

    // Should be online initially
    await pwaPage.expectOnline()

    // Go offline
    await pwaPage.goOffline(context)

    try {
      // Check if page detected offline status
      await pwaPage.expectOffline()
    } finally {
      await pwaPage.goOnline(context)
    }
  })
})
