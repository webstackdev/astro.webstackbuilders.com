/**
 * WCAG 2.2 Standards Enhanced Color Contrast Compliance Tests for a11y theme
 */
import AxeBuilder from '@axe-core/playwright'
import { BasePage, describe, test, expect } from '@test/e2e/helpers'
import { runAcrossPages } from '@test/e2e/helpers/runAcrossPages'
import { waitForAnimationFrames } from '@test/e2e/helpers/waitHelpers'

const wcagTheme = 'a11y'

describe('WCAG Compliance', () => {
  test('run axe enhanced color contrast audit on all main pages in a11y theme', async ({ page: playwrightPage }) => {
    test.slow()
    test.setTimeout(90_000)

    const page = await BasePage.init(playwrightPage)

    await runAcrossPages(page, 'check enhanced color contrast in a11y theme', async (url) => {
      // Navigate first so we have an origin for localStorage, then set theme and reload
      await page.goto(url)
      await page.page.evaluate((themeId) => {
        localStorage.setItem('theme', themeId)
      }, wcagTheme)
      await page.page.reload({ waitUntil: 'domcontentloaded' })

      await page.page.waitForFunction((themeId) => {
        return document.documentElement.getAttribute('data-theme') === themeId
      }, wcagTheme)
      await waitForAnimationFrames(page.page, 2)

      const results = await new AxeBuilder({ page: page.page })
        .withRules(['color-contrast-enhanced'])
        .analyze()

      expect(results.violations).toEqual([])
      expect(results.incomplete).toEqual([])
    })
  })
})
