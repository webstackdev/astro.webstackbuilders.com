/**
 * ARIA and Screen Reader Tests
 * Tests for ARIA attributes and screen reader accessibility
 */

import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('ARIA and Screen Readers', () => {
  test('@ready page has main landmark', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')

    await page.expectMainElement()
  })

  test('@ready page has navigation landmark', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')

    const nav = page.page.locator('nav, [role="navigation"]')
    const count = await nav.count()
    expect(count).toBeGreaterThan(0)
  })

  test('@ready buttons have accessible labels', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
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

  test('@ready links have meaningful text', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
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

  test('@ready images have alt text', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
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

  test('@ready form inputs have labels', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
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

  test('@ready page has exactly one h1', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')

    const h1 = page.page.locator('h1')
    await expect(h1).toHaveCount(1)

    const h1Text = await h1.textContent()
    expect(h1Text?.trim().length).toBeGreaterThan(0)
  })

  test('@ready required fields are marked', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/contact')

    const emailInput = page.page.locator('input[type="email"]').first()
    const isRequired = await emailInput.getAttribute('required')
    const ariaRequired = await emailInput.getAttribute('aria-required')

    expect(isRequired !== null || ariaRequired === 'true').toBe(true)
  })

  test('@ready lists use proper markup', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
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
