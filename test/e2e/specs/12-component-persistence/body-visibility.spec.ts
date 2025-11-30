/**
 * Regression Tests for Astro View Transitions - Body Visibility
 *
 * Ensures the "invisible" class used to prevent FOUC on initial load is removed
 * from the swapped document's <body> whenever Astro View Transitions performs
 * client-side navigation. This guards against blank pages during soft reloads.
 *
 * Related:
 * - src/layouts/BaseLayout.astro (initial invisible class)
 * - src/components/ThemePicker/ThemeInit.astro (runtime theme init logic)
 */

import { BasePage, expect, test } from '@test/e2e/helpers'

test.describe('View Transitions - body visibility reset', () => {
  test('removes invisible class from swapped document body', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const astroBeforeSwapLog = page.consoleMssgPromise('Theme init on "astro:before-swap" executed')

    await page.navigateToPage('/about')
    await page.waitForPageLoad()

    const logMessage = await astroBeforeSwapLog
    expect(logMessage.text()).toContain('Theme init on "astro:before-swap" executed')

    const bodyHasInvisibleAfterNav = await page.evaluate(() => document.body.classList.contains('invisible'))
    expect(bodyHasInvisibleAfterNav).toBe(false)
  })
})
