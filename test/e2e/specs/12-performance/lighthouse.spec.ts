import { chromium } from '@playwright/test'
import { LighthousePage, expect, test } from '@test/e2e/helpers'
import { pages as allPages } from '@test/e2e/helpers/runAcrossPages'

const getReportNameForPath = (path: string): string => {
  const normalizedPath = path === '/' ? 'home' : path.replace(/^\/+|\/+$/g, '')
  const slug = normalizedPath.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()

  return `lighthouse-${slug || 'page'}-desktop`
}

test.describe('Lighthouse Performance', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Lighthouse audits require Chromium')

  test.describe.configure({ mode: 'serial' })

  test('run Lighthouse audit on main pages', async ({ page: _page }, testInfo) => {
    test.slow()
    test.setTimeout(allPages.length * 30_000)

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
    const failures: string[] = []

    try {
      const lighthousePage = await LighthousePage.init(page)
      for (const url of allPages) {
        await test.step(`run Lighthouse audit on ${url}`, async () => {
          try {
            await lighthousePage.goto(url)

            await lighthousePage.runDesktopAudit({
              port,
              reportName: getReportNameForPath(url),
              directory: '.cache/playwright/lighthouse-reports',
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            failures.push(`${url}: ${message}`)
          }
        })
      }

      expect(failures).toEqual([])
    } finally {
      await browser.close()
    }
  })
})
