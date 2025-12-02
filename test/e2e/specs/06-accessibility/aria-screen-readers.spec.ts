/**
 * ARIA and Screen Reader Tests
 * Tests for ARIA attributes and screen reader accessibility
 */

import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('ARIA and Screen Readers', () => {
  /**
   * Axe checks for a main landmark in a few ways: it verifies that there is
   * exactly one main landmark, that the main landmark is not nested inside
   * another landmark, and that all page content is contained within a landmark
   * region.
   */
  test('@ready page has main landmark', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    await page.expectMainElement()
  })

  /**
   * Axe checks for navigation landmarks by using rules like region to ensure all content
   * is inside a landmark, and landmark-one-main to verify that there is only one main
   * landmark for the page's primary content. It also checks for duplicate landmarks
   * (like a banner landmark) and ensures the main landmark is at the top level and not
   * nested inside other landmarks.
   */
  test('@ready page has navigation landmark', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const nav = page.page.locator('nav, [role="navigation"]')
    const count = await nav.count()
    expect(count).toBeGreaterThan(0)
  })

  /**
   * Axe checks that buttons have accessible labels, specifically through the button-name
   * rule which is a critical accessibility issue. This rule ensures that all buttons have
   * a discernible name so that screen reader users can understand their purpose, even if
   * the button is an icon without visible text.
   */
  test('@ready buttons have accessible labels', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const buttons = page.page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const ariaLabelledBy = await button.getAttribute('aria-labelledby')

      // Each button should have text or aria-label
      expect(text?.trim() || ariaLabel || ariaLabelledBy).toBeTruthy()
    }
  })

  /**
   * Axe checks that links have accessible labels and sufficient, discernible text.
   * Its link-name rule ensures that all links, including those with images, have an
   * accessible name that screen readers can use to describe the link's purpose. This
   * includes checking for things like empty links or links that are unclear to
   * assistive technologies.
   */
  test('@ready links have meaningful text', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const links = page.page.locator('a[href]')
    const count = await links.count()

    for (let i = 0; i < Math.min(count, 20); i++) {
      const link = links.nth(i)
      const text = await link.textContent()
      const ariaLabel = await link.getAttribute('aria-label')

      const linkText = (text || ariaLabel || '').trim().toLowerCase()

      // Link should have meaningful text, not just "here" or "click"
      if (linkText) {
        expect(linkText.length).toBeGreaterThan(0)
        // Avoid generic link text
        expect(linkText).not.toBe('here')
        expect(linkText).not.toBe('click')
      }
    }
  })

  /**
   * Axe automatically checks that images have alt text and flags missing alt text
   */
  test('@ready images have alt text', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const images = page.page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')

      // Alt can be empty for decorative images, but must be present
      expect(alt).not.toBeNull()
    }
  })

  /**
   * Axe checks that form inputs have labels
   */
  test('@ready form inputs have labels', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')

    const inputs = page.page.locator('input[type="text"], input[type="email"], textarea')
    const count = await inputs.count()

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')

      if (id) {
        const label = page.page.locator(`label[for="${id}"]`)
        const hasLabel = (await label.count()) > 0
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy()
      } else {
        // If no id, must have aria-label or aria-labelledby
        expect(ariaLabel || ariaLabelledBy).toBeTruthy()
      }
    }
  })

  /**
   * Axe does not have a rule that checks for exactly one <h1> per page, and it explicitly
   * avoids flagging multiple <h1> elements as a violation. The developers have determined
   * that there are valid use cases for having multiple <h1> headings on a single page
   * like modals and iframes. Axe does have a rule, page-has-heading-one, that verifies
   * a page contains at least one <h1> element. This helps ensure that screen reader users
   * can quickly navigate to the page's main content. Axe checks that heading levels are
   * not skipped (e.g., jumping from an <h1> directly to an <h3>). This ensures a logical
   * and hierarchical document structure for assistive technology users. Axe will report
   * an issue if a heading element (<h1> through <h6>) is empty or hidden from assistive
   * technologies.
   */
  test('@ready page has exactly one h1', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const h1 = page.page.locator('h1')
    await expect(h1).toHaveCount(1)

    const h1Text = await h1.textContent()
    expect(h1Text?.trim().length).toBeGreaterThan(0)
  })

  /**
   * Axe checks that required fields are marked, but only if they are programmatically
   * identified with the aria-required="true" attribute. It does not automatically check
   * for visual indicators like asterisks or the word "required" unless they are also
   * programmatically associated with the field.
   */
  test('@ready required fields are marked', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')

    const emailInput = page.page.locator('input[type="email"]').first()
    const isRequired = await emailInput.getAttribute('required')
    const ariaRequired = await emailInput.getAttribute('aria-required')

    expect(isRequired !== null || ariaRequired === 'true').toBe(true)
  })

  /**
   * Axe checks that lists use proper markup. It enforces several rules to ensure lists
   * are structured correctly and semantically, which helps assistive technologies like
   * screen readers interpret them properly.
   */
  test('@ready lists use proper markup', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const lists = page.page.locator('ul, ol, [role="list"]')
    const count = await lists.count()

    expect(count).toBeGreaterThan(0)

    // Check that list items are children of lists
    for (let i = 0; i < Math.min(count, 3); i++) {
      const list = lists.nth(i)
      const items = list.locator('li, [role="listitem"]')
      const itemCount = await items.count()

      expect(itemCount).toBeGreaterThan(0)
    }
  })
})
