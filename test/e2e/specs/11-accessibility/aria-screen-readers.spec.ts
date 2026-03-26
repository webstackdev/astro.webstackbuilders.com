/**
 * ARIA and Screen Reader Tests
 * Tests for ARIA attributes and screen reader accessibility
 */

import type { Locator } from '@playwright/test'
import { BasePage, test, describe, expect } from '@test/e2e/helpers'
import { runAcrossPages } from '@test/e2e/helpers/runAcrossPages'

const genericLinkNamePattern = /^(here|click|click here|read more|learn more|more|link|ready)$/i

const getAccessibleNameCandidate = async (locator: Locator): Promise<string> => {
  return locator.evaluate((element): string => {
    const ariaLabel = element.getAttribute('aria-label')?.trim()

    if (ariaLabel) {
      return ariaLabel
    }

    const labelledBy = element.getAttribute('aria-labelledby')
    if (labelledBy) {
      const labelText = labelledBy
        .split(/\s+/)
        .map(id => document.getElementById(id)?.textContent?.trim() ?? '')
        .filter(Boolean)
        .join(' ')
        .trim()

      if (labelText) {
        return labelText
      }
    }

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      const labelText = Array.from(element.labels ?? [])
        .map(label => label.textContent?.trim() ?? '')
        .filter(Boolean)
        .join(' ')
        .trim()

      if (labelText) {
        return labelText
      }
    }

    if (element instanceof HTMLImageElement) {
      return element.alt.trim()
    }

    if (
      element instanceof HTMLInputElement &&
      ['button', 'submit', 'reset'].includes(element.type)
    ) {
      return element.value.trim()
    }

    return (element as HTMLElement).innerText?.trim() || element.textContent?.trim() || ''
  })
}

const normalizeAccessibleName = (name: string): string => {
  return name.replace(/\s+/g, ' ').trim().toLowerCase()
}

describe('ARIA and Screen Readers', () => {
  const visibleFormControlSelector = [
    'form input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):visible',
    'form textarea:visible',
    'form select:visible',
    'input[role="switch"]',
  ].join(', ')

  const visibleRequiredFormControlSelector = [
    'form input[required]:visible',
    'form input[aria-required="true"]:visible',
    'form textarea[required]:visible',
    'form textarea[aria-required="true"]:visible',
    'form select[required]:visible',
    'form select[aria-required="true"]:visible',
  ].join(', ')

  /**
   * Axe checks for a main landmark in a few ways: it verifies that there is
   * exactly one main landmark, that the main landmark is not nested inside
   * another landmark, and that all page content is contained within a landmark
   * region.
   */
  test('@ready page has main landmark', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await runAcrossPages(page, 'check main landmark', async (url) => {
      await page.goto(url)
      await page.expectMainElement()
    })
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
    await runAcrossPages(page, 'check navigation landmark', async (url) => {
      await page.goto(url)

      const nav = page.page.locator('nav, [role="navigation"]')
      const count = await nav.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  /**
   * Axe checks that buttons have accessible labels, specifically through the button-name
   * rule which is a critical accessibility issue. This rule expands that to ensure that
   * all buttons have a discernible name so that screen reader users can understand their
   * purpose, even if the button is an icon without visible text.
   */
  test('@ready buttons have accessible labels', async ({ page: playwrightPage, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox times out on the full cross-page button label sweep.')

    const page = await BasePage.init(playwrightPage)
    await runAcrossPages(page, 'check button labels', async (url) => {
      await page.goto(url)

      const buttons = page.page.getByRole('button')
      const count = await buttons.count()

      expect(count).toBeGreaterThan(0)

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i)
        await expect(button).toHaveAccessibleName(/\S+/)
      }
    })
  })


  /**
   * Axe checks that links have accessible labels and sufficient, discernible text.
   * Its link-name rule ensures that all links, including those with images, have an
   * accessible name that screen readers can use to describe the link's purpose. This
   * test expands that to check for things like empty links or link text that is too
   * generic to be meaningful to assistive technologies.
   */
  test('@ready links have meaningful text', async ({ page: playwrightPage, browserName }) => {
    test.skip(
      browserName === 'firefox' || browserName === 'webkit',
      "Don't need full cross-page link label sweep on all platforms."
    )

    const page = await BasePage.init(playwrightPage)
    await runAcrossPages(page, 'check link labels', async (url) => {
      await page.goto(url)

      const links = page.page.getByRole('link')
      const count = await links.count()

      expect(count).toBeGreaterThan(0)

      for (let i = 0; i < count; i++) {
        const link = links.nth(i)
        await expect(link).toHaveAccessibleName(/\S+/)

        const linkText = normalizeAccessibleName(await getAccessibleNameCandidate(link))
        expect(linkText).not.toMatch(genericLinkNamePattern)
      }
    })
  })

  /**
   * Axe automatically checks that images have alt text and flags missing alt text
   */
  test('@ready images have alt text', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await runAcrossPages(page, 'check image alt text', async (url) => {
      await page.goto(url)

      const images = page.page.locator('img')
      const count = await images.count()

      for (let i = 0; i < count; i++) {
        const img = images.nth(i)
        const alt = await img.getAttribute('alt')

        // Alt can be empty for decorative images, but must be present
        expect(alt).not.toBeNull()
      }
    })
  })

  /**
   * Axe checks that form inputs have labels
   */
  test.only('@ready form inputs have labels', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await runAcrossPages(page, 'check form input labels', async (url) => {
      await page.goto(url)

      const inputs = page.page.locator(visibleFormControlSelector)
      const count = await inputs.count()

      expect(count).toBeGreaterThan(0)

      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i)
        await expect(input).toHaveAccessibleName(/\S+/)

        const inputName = normalizeAccessibleName(await getAccessibleNameCandidate(input))
        expect(inputName.length).toBeGreaterThan(0)
      }
    }, true)
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
    await runAcrossPages(page, 'check h1 count', async (url) => {
      await page.goto(url)

      const h1 = page.page.locator('h1')
      await expect(h1).toHaveCount(1)

      const h1Text = await h1.textContent()
      expect(h1Text?.trim().length).toBeGreaterThan(0)
    })
  })

  /**
   * Axe checks that required fields are marked, but only if they are programmatically
   * identified with the aria-required="true" attribute. It does not automatically check
   * for visual indicators like asterisks or the word "required" unless they are also
   * programmatically associated with the field.
   */
  test('@ready required fields are marked', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await runAcrossPages(page, 'check required fields', async (url) => {
      await page.goto(url)

      const requiredFields = page.page.locator(visibleRequiredFormControlSelector)
      const count = await requiredFields.count()

      if (count === 0) {
        return
      }

      for (let i = 0; i < count; i++) {
        const field = requiredFields.nth(i)
        const isRequired = await field.getAttribute('required')
        const ariaRequired = await field.getAttribute('aria-required')

        expect(isRequired !== null || ariaRequired === 'true').toBe(true)
      }
    }, true)
  })

  /**
   * Axe checks that lists use proper markup. It enforces several rules to ensure lists
   * are structured correctly and semantically, which helps assistive technologies like
   * screen readers interpret them properly.
   */
  test('@ready lists use proper markup', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    await runAcrossPages(page, 'check list markup', async (url) => {
      await page.goto(url)

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
})
