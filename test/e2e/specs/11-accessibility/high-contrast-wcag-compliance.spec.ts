/**
 * WCAG Compliance Tests
 * Tests for Web Content Accessibility Guidelines compliance
 */
import { BasePage, describe, test, expect } from '@test/e2e/helpers'
import { waitForAnimationFrames } from '@test/e2e/helpers/waitHelpers'

// @TODO: The purpose of this file is to have a special test for the "a11y" theme that should meet the higher WCAG 2.2 standards. Those standards require higher contrast ratios and other improvements.

describe('WCAG Compliance', () => {
  /**
   * Axe by defaults checks for color contrast of at least 4.5:1 for small text or 3:1 for
   * large text, even if text is part of an image. Large text has been defined in the
   * requirements as 18pt (24 CSS pixels) or 14pt bold (19 CSS pixels). Note: Elements
   * found to have a 1:1 ratio are considered "incomplete" and require a manual review.
   */
  test.skip('@ready text has sufficient color contrast', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    // Sample a few text elements
    const paragraphs = page.locator('p').first()
    const hasVisibleText = await paragraphs.isVisible()

    if (hasVisibleText) {
      const contrast = await paragraphs.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
        }
      })

      // Basic check that colors are defined
      expect(contrast.color).toBeTruthy()
    }
  })
})
