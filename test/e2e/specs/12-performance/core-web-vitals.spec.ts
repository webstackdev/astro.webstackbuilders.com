/**
 * Core Web Vitals Tests
 * Tests for Core Web Vitals metrics (LCP, FID, CLS)
 */

import { test } from '@test/e2e/helpers'
import { CoreWebVitalsPage } from '@test/e2e/helpers/pageObjectModels/CoreWebVitalsPage'

test.describe('Core Web Vitals', () => {
  let coreWebVitalsPage: CoreWebVitalsPage

  test.beforeEach(async ({ page: playwrightPage }) => {
    coreWebVitalsPage = await CoreWebVitalsPage.init(playwrightPage)
    await coreWebVitalsPage.goto('/')
  })

  test.skip('@blocked Largest Contentful Paint under 2.5s', async () => {
    await coreWebVitalsPage.expectLCPUnder(2500)
  })

  test.skip('@ready First Input Delay simulation', async () => {
    await coreWebVitalsPage.expectFIDUnder(100)
  })

  test.skip('@ready Cumulative Layout Shift under 0.1', async () => {
    // Wait for page to settle
    await coreWebVitalsPage.waitForPageComplete()
    await coreWebVitalsPage.expectCLSUnder(0.1)
  })

  test('@ready Time to Interactive under 3.8s', async () => {
    await coreWebVitalsPage.expectTTIUnder(3800)
  })

  test.skip('@blocked First Contentful Paint under 1.8s', async () => {
    await coreWebVitalsPage.expectFCPUnder(1800)
  })

  test.skip('@blocked Total Blocking Time under 200ms', async () => {
    // Wait for page to fully load
    await coreWebVitalsPage.waitForLoadState('networkidle')
    await coreWebVitalsPage.expectTBTUnder(200)
  })

  test('@ready Speed Index under 3.4s', async () => {
    await coreWebVitalsPage.expectSpeedIndexUnder(3400)
  })

  test.skip('@blocked page load time under 3s', async () => {
    // Create new page for fresh measurement
    const startTime = Date.now()
    await coreWebVitalsPage.goto('/')
    await coreWebVitalsPage.waitForLoadState('load')
    const endTime = Date.now()
    const loadTime = endTime - startTime

    coreWebVitalsPage.page.evaluate((time) => {
      if (time >= 3000) {
        const EvaluationErrorCtor = window.EvaluationError!
        throw new EvaluationErrorCtor(`Page load time ${time}ms exceeds 3000ms threshold`)
      }
    }, loadTime)
  })

  test('@ready images load efficiently', async () => {
    await coreWebVitalsPage.expectLazyLoadedImages()
    await coreWebVitalsPage.expectNoOversizedImages(3000)
  })

  test('@ready no render-blocking resources', async () => {
    await coreWebVitalsPage.expectMinimalRenderBlocking(5)
  })
})

