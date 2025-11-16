/**
 * E2E Regression Tests for Client Environment Detection
 *
 * Issue: Environment detection functions should work correctly in browser context
 * Solution: Test environment utilities in actual browser environment via page.evaluate()
 *
 * @see src/components/scripts/utils/environmentClient.ts
 */

import { test, expect } from '@test/e2e/helpers'
import { BasePage } from '@test/e2e/helpers/pageObjectModels/BasePage'

test.describe('Client Environment Detection Regression', () => {
  test('isUnitTest should return false in browser context', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    // Navigate to a page so the dev server context is available
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Execute the environment detection function in the browser context
    // Import and call the function directly in the browser
    const isUnitTestResult = await page.page.evaluate(async () => {
      // @ts-expect-error - Browser-side import, path resolved by dev server at runtime
      const { isUnitTest } = await import('/src/components/scripts/utils/environmentClient.ts')
      return isUnitTest()
    })

    // Assert that isUnitTest returns false when called in browser
    expect(isUnitTestResult).toBe(false)
  })

  test('isTest should return true in browser context', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const isTestResult = await page.page.evaluate(async () => {
      // @ts-expect-error - Browser-side import, path resolved by dev server at runtime
      const { isTest } = await import('/src/components/scripts/utils/environmentClient.ts')
      return isTest()
    })

    // Assert that isTest returns true in E2E test context
    expect(isTestResult).toBe(true)
  })

  test('isE2eTest should return true in browser context', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const isE2eTestResult = await page.page.evaluate(async () => {
      // @ts-expect-error - Browser-side import, path resolved by dev server at runtime
      const { isE2eTest } = await import('/src/components/scripts/utils/environmentClient.ts')
      return isE2eTest()
    })

    // Assert that isE2eTest returns true when running in Playwright
    expect(isE2eTestResult).toBe(true)
  })

  test('isDev should return true in browser context', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const isDevResult = await page.page.evaluate(async () => {
      // @ts-expect-error - Browser-side import, path resolved by dev server at runtime
      const { isDev } = await import('/src/components/scripts/utils/environmentClient.ts')
      return isDev()
    })

    // Assert that isDev returns true when running against dev server
    expect(isDevResult).toBe(true)
  })

  test('isProd should return false in browser context', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const isProdResult = await page.page.evaluate(async () => {
      // @ts-expect-error - Browser-side import, path resolved by dev server at runtime
      const { isProd } = await import('/src/components/scripts/utils/environmentClient.ts')
      return isProd()
    })

    // Assert that isProd returns false when running against dev server
    expect(isProdResult).toBe(false)
  })
})