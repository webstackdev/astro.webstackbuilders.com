import { test, expect } from '@test/e2e/helpers'
import { TestError } from '@test/errors'
import { BasePage } from '@test/e2e/helpers/pageObjectModels/BasePage'

type SiteUrlSnapshot = {
  siteUrl: string
}

const navigateToDiagnosticsPage = async (page: BasePage) => {
  await page.goto('/testing/site-url-api', { skipCookieDismiss: true })
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(() => Boolean(window.siteUrlApiSnapshot))
}

const getSnapshot = async (page: BasePage): Promise<SiteUrlSnapshot> => {
  await navigateToDiagnosticsPage(page)
  return await page.evaluate(() => {
    if (!window.siteUrlApiSnapshot) {
      throw new TestError('Site URL api snapshot not initialized')
    }
    return window.siteUrlApiSnapshot
  })
}

test.describe('Site URL API Diagnostics', () => {
  test('should resolve localhost URL for non-Vercel dev runtime', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const snapshot = await getSnapshot(page)
    expect(snapshot.siteUrl).toContain('http://localhost:')
  })
})
