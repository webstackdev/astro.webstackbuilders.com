/**
 * Core Web Vitals Tests
 * Tests for Core Web Vitals metrics (LCP, FID, CLS)
 */

import { test } from '@test/e2e/helpers'
import { TestError } from '@test/errors'
import { PerformancePage } from '@test/e2e/helpers/pageObjectModels/PerformancePage'

test.describe('Core Web Vitals', () => {
  let performancePage: PerformancePage

  test.beforeEach(async ({ page: playwrightPage }) => {
    performancePage = await PerformancePage.init(playwrightPage)
    await performancePage.goto('/')
  })

  test('@ready Largest Contentful Paint under 2.5s', async () => {
    await performancePage.expectLCPUnder(2500)
  })

  test('@ready First Input Delay simulation', async () => {
    await performancePage.expectFIDUnder(100)
  })

  test('@ready Cumulative Layout Shift under 0.1', async () => {
    // Wait for page to settle
    await performancePage.wait(3000)
    await performancePage.expectCLSUnder(0.1)
  })

  test('@ready Time to Interactive under 3.8s', async () => {
    await performancePage.expectTTIUnder(3800)
  })

  test('@ready First Contentful Paint under 1.8s', async () => {
    await performancePage.expectFCPUnder(1800)
  })

  test('@ready Total Blocking Time under 200ms', async () => {
    // Wait for page to fully load
    await performancePage.waitForLoadState('networkidle')
    await performancePage.expectTBTUnder(200)
  })

  test('@ready Speed Index under 3.4s', async () => {
    await performancePage.expectSpeedIndexUnder(3400)
  })

  test('@ready page load time under 3s', async () => {
    // Create new page for fresh measurement
    const startTime = Date.now()
    await performancePage.goto('/')
    await performancePage.waitForLoadState('load')
    const endTime = Date.now()
    const loadTime = endTime - startTime

    performancePage.page.evaluate((time) => {
      if (time >= 3000) {
        throw new TestError(`Page load time ${time}ms exceeds 3000ms threshold`)
      }
    }, loadTime)
  })

  test('@ready images load efficiently', async () => {
    await performancePage.expectLazyLoadedImages()
    await performancePage.expectNoOversizedImages(3000)
  })

  test('@ready no render-blocking resources', async () => {
    await performancePage.expectMinimalRenderBlocking(5)
  })
})

