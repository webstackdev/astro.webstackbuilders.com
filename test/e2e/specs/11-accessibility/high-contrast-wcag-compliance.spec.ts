/**
 * WCAG Compliance Tests
 * Tests for Web Content Accessibility Guidelines compliance
 */
import { writeFileSync } from 'fs'
import AxeBuilder from '@axe-core/playwright'
import { BasePage, describe, test, expect } from '@test/e2e/helpers'
import { runAcrossPages } from '@test/e2e/helpers/runAcrossPages'
import { waitForAnimationFrames } from '@test/e2e/helpers/waitHelpers'

// @TODO: The purpose of this file is to have a special test for the "a11y" theme that should meet the higher WCAG 2.2 standards. Those standards require higher contrast ratios and other improvements.

const wcagTheme = 'a11y'

describe('WCAG Compliance', () => {
  test.skip('run axe enhanced color contrast audit on all main pages in a11y theme', async ({ page: playwrightPage }) => {
    test.slow()
    test.setTimeout(90_000)

    const page = await BasePage.init(playwrightPage)

    await page.page.addInitScript((themeId) => {
      document.documentElement.setAttribute('data-theme', themeId)

      try {
        window.localStorage.setItem('theme', themeId)
      } catch {
        // Ignore localStorage write failures in constrained browser contexts.
      }
    }, wcagTheme)

    await runAcrossPages(page, 'check enhanced color contrast in a11y theme', async (url) => {
      await page.goto(url)

      await page.page.waitForFunction((themeId) => {
        const activeTheme = document.documentElement.getAttribute('data-theme')

        try {
          return activeTheme === themeId && window.localStorage.getItem('theme') === themeId
        } catch {
          return activeTheme === themeId
        }
      }, wcagTheme)
      await waitForAnimationFrames(page.page, 2)

      const results = await new AxeBuilder({ page: page.page })
        .withRules(['color-contrast-enhanced'])
        .analyze()

      const incompleteResultsString = JSON.stringify(results.incomplete, null, 2)
      writeFileSync('axe-results-incomplete.json', incompleteResultsString, 'utf8')

      const violationResultsString = JSON.stringify(results.violations, null, 2)
      writeFileSync('axe-results-violations.json', violationResultsString, 'utf8')

      expect(results.violations).toEqual([])
      expect(results.incomplete).toEqual([])
    })
  })
})
