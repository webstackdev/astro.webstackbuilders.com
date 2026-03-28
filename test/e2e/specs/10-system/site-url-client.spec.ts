import { test, expect } from '@test/e2e/helpers'
import { BasePage } from '@test/e2e/helpers/pageObjectModels/BasePage'

type SiteUrlSnapshot = {
  siteUrl: string
}

const navigateToDiagnosticsPage = async (page: BasePage) => {
  await page.goto('/testing/site-url-client', { skipCookieDismiss: true })
  // NOTE: Avoid strict 'networkidle' gating on WebKit/mobile-safari (can hang on long-lived requests).
  await page.waitForNetworkIdleBestEffort()
  await page.waitForFunction(() => Boolean(window.siteUrlClientSnapshot))
}

const getSnapshot = async (page: BasePage): Promise<SiteUrlSnapshot> => {
  await navigateToDiagnosticsPage(page)
  return await page.evaluate(() => {
    if (!window.siteUrlClientSnapshot) {
      const EvaluationErrorCtor = window.EvaluationError!
      throw new EvaluationErrorCtor('Site URL client snapshot not initialized')
    }
    return window.siteUrlClientSnapshot
  })
}

test.describe('Site URL Client Diagnostics', () => {
  test('should resolve localhost URL in dev server', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const snapshot = await getSnapshot(page)
    expect(snapshot.siteUrl).toContain('http://localhost:')
  })
})
