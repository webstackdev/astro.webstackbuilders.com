import { chromium } from '@playwright/test'
import { LighthousePage, test } from '@test/e2e/helpers'

test.describe('Lighthouse Performance', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Lighthouse audits require Chromium')

  test.describe.configure({ mode: 'serial' })

  test('run Lighthouse audit on homepage', async (_fixtures, testInfo) => {
    const baseURL = testInfo.project.use.baseURL

    if (!baseURL || typeof baseURL !== 'string') {
      throw new Error('Missing Playwright baseURL for Lighthouse tests')
    }

    const port = await LighthousePage.getFreePort()

    const browser = await chromium.launch({
      args: [`--remote-debugging-port=${port}`],
    })

    const context = await browser.newContext({ baseURL })
    const page = await context.newPage()

    try {
      const lighthousePage = await LighthousePage.init(page)
      await lighthousePage.goto('/')

      await lighthousePage.runDesktopAudit({
        port,
        reportName: `${testInfo.title}-desktop`,
        directory: '.cache/playwright/lighthouse-reports',
      })
    } finally {
      await browser.close()
    }
  })
})
