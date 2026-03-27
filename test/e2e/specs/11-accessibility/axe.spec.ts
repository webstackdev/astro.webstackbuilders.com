/**
 * Axe Core Tests
 */
import { writeFileSync } from 'fs'
import AxeBuilder from '@axe-core/playwright'
import { BasePage, describe, test, expect } from '@test/e2e/helpers'
import { runAcrossPages } from '@test/e2e/helpers/runAcrossPages'

// https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md?plain=1

/*
cat.aria: Rules related to Accessible Rich Internet Applications (ARIA) attributes and roles.
cat.color: Rules related to color contrast and meaning conveyed by color.
cat.controls: Rules for interactive controls, such as form elements and links.
cat.forms: Rules specifically for forms, form fields, and their labels.
cat.keyboard: Rules related to keyboard operability.
cat.links: Rules for links, including their names and destinations.
cat.name-role-value: Rules that check if an element has a name, role, and value that can be correctly interpreted by assistive technologies.
cat.semantics: Rules related to the semantic structure of a document, such as headings and landmarks.
cat.sensory-and-visual-cues: Rules that deal with information conveyed by sensory or visual characteristics.
cat.structure: Rules related to the document's overall structure, like the proper nesting of elements.
cat.tables: Rules for data tables, including headers and associations.
cat.text-alternatives: Rules for ensuring that text alternatives are provided for non-text content, such as images.
*/

describe('WCAG Compliance', () => {
  test.only('run axe accessibility audit with default theme', async ({ page: playwrightPage }) => {
    test.slow()
    test.setTimeout(90_000)

    const page = await BasePage.init(playwrightPage)
    await runAcrossPages(page, 'check forms', async (url) => {
      await page.goto(url)
      const results = await new AxeBuilder({ page: page.page })
        .withTags(['cat.aria'])
        .disableRules('color-contrast-enhanced')
        .analyze()

      const incompleteResultsString = JSON.stringify(results.incomplete, null, 2)
      writeFileSync('axe-results-incomplete.json', incompleteResultsString, 'utf8')

      const violationResultsString = JSON.stringify(results.violations, null, 2)
      writeFileSync('axe-results-violations.json', violationResultsString, 'utf8')

      expect(results.violations).toEqual([])
      expect(results.incomplete).toEqual([])
    })
  })

  test('run axe audit on all main pages', async ({ page: playwrightPage }) => {
    test.slow()
    test.setTimeout(90_000)

    const page = await BasePage.init(playwrightPage)
    await runAcrossPages(page, 'check forms', async (url) => {
      await page.goto(url)
      const results = await new AxeBuilder({ page: page.page })
        .withTags(['cat.forms'])
        .analyze()
      expect(results.violations).toEqual([])
    }, true)
  })
})
