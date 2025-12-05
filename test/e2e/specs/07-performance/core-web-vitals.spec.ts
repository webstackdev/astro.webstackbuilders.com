/**
 * Core Web Vitals Tests
 * Tests for Core Web Vitals metrics (LCP, FID, CLS)
 */

import { test } from '@test/e2e/helpers'
import { PerformancePage } from '@test/e2e/helpers/pageObjectModels/PerformancePage'

test.describe('Core Web Vitals', () => {
  let performancePage: PerformancePage

  test.beforeEach(async ({ page: playwrightPage }) => {
    performancePage = await PerformancePage.init(playwrightPage)
    await performancePage.goto('/')
  })

  test.skip('@blocked Largest Contentful Paint under 2.5s', async () => {
    await performancePage.expectLCPUnder(2500)
  })

  test.skip('@ready First Input Delay simulation', async () => {
    await performancePage.expectFIDUnder(100)
  })

  test.skip('@ready Cumulative Layout Shift under 0.1', async () => {
    // Wait for page to settle
    await performancePage.waitForPageComplete()
    await performancePage.expectCLSUnder(0.1)
  })

  test('@ready Time to Interactive under 3.8s', async () => {
    await performancePage.expectTTIUnder(3800)
  })

  test.skip('@blocked First Contentful Paint under 1.8s', async () => {
    await performancePage.expectFCPUnder(1800)
  })

  test.skip('@blocked Total Blocking Time under 200ms', async () => {
    // Wait for page to fully load
    await performancePage.waitForLoadState('networkidle')
    await performancePage.expectTBTUnder(200)
  })

  test('@ready Speed Index under 3.4s', async () => {
    await performancePage.expectSpeedIndexUnder(3400)
  })

  test.skip('@blocked page load time under 3s', async () => {
    // Create new page for fresh measurement
    const startTime = Date.now()
    await performancePage.goto('/')
    await performancePage.waitForLoadState('load')
    const endTime = Date.now()
    const loadTime = endTime - startTime

    performancePage.page.evaluate((time) => {
      if (time >= 3000) {
        const EvaluationErrorCtor = window.EvaluationError!
        throw new EvaluationErrorCtor(`Page load time ${time}ms exceeds 3000ms threshold`)
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

