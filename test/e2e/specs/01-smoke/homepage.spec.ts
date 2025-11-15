/**
 * Homepage Smoke Test
 * Dedicated test for homepage basic functionality and app initialization
 */
import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Homepage @smoke', () => {
  test('@ready homepage loads successfully', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    // Verify a few known elements are present
    await page.expectTitle(/Webstack Builders/)

    // Verify main content is visible
    await page.expectMainElement()
    await page.expectHeading()
  })

  test('@ready homepage sets theme key successfully', async ({ page: playwrightPage  }) => {
    const page = await BasePage.init(playwrightPage)
    const themeKeyPromise = page.themeKeyPromise()
    await page.goto('/')
    await themeKeyPromise
    const result = await page.getThemeKeyValue()
    expect(result).toBe('default')
  })

  test('@ready homepage has no errors', async ({ page: playwrightPage  }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    await page.expectNoErrors()
  })
})