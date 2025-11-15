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
import { setupTestPage } from '@test/e2e/helpers/cookieHelper'

test.describe('Client Environment Detection Regression', () => {
  test.beforeEach(async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await setupTestPage(page.page, '/')
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
  })

  test('isUnitTest should return false in browser context', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    
    // Execute the environment detection function in the browser context
    // Import and call the function directly in the browser
    const isUnitTestResult = await page.page.evaluate(async () => {
      const { isUnitTest } = await import('/src/components/scripts/utils/environmentClient.ts')
      return isUnitTest()
    })

    // Assert that isUnitTest returns false when called in browser
    expect(isUnitTestResult).toBe(false)
  })
})