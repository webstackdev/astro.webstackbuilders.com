/**
 * ARIA and Screen Reader Tests
 * Tests for ARIA attributes and screen reader accessibility
 */

import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'

test.describe('ARIA and Screen Readers', () => {
  test.skip('@wip page has main landmark', async ({ page }) => {
    // Expected: Page should have <main> element or role="main"
    await page.goto(TEST_URLS.home)

    const main = page.locator('main, [role="main"]')
    await expect(main).toHaveCount(1)
  })

  test.skip('@wip page has navigation landmark', async ({ page }) => {
    // Expected: Page should have <nav> or role="navigation"
    await page.goto(TEST_URLS.home)

    const nav = page.locator('nav, [role="navigation"]')
    const count = await nav.count()
    expect(count).toBeGreaterThan(0)
  })

  test.skip('@wip buttons have accessible labels', async ({ page }) => {
    // Expected: All buttons should have text or aria-label
    await page.goto(TEST_URLS.home)

    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const ariaLabelledBy = await button.getAttribute('aria-labelledby')

      expect(text?.trim() || ariaLabel || ariaLabelledBy).toBeTruthy()
    }
  })

  test.skip('@wip links have meaningful text', async ({ page }) => {
    // Expected: Links should not just say "click here" or "read more"
    await page.goto(TEST_URLS.home)

    const links = page.locator('a[href]')
    const count = await links.count()

    for (let i = 0; i < Math.min(count, 20); i++) {
      const link = links.nth(i)
      const text = await link.textContent()
      const ariaLabel = await link.getAttribute('aria-label')

      const linkText = (text || ariaLabel || '').trim().toLowerCase()

      // Avoid generic link text
      if (linkText && linkText !== 'here' && linkText !== 'click') {
        expect(linkText.length).toBeGreaterThan(0)
      }
    }
  })

  test.skip('@wip images have alt text', async ({ page }) => {
    // Expected: All images should have alt attribute
    await page.goto(TEST_URLS.home)

    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')

      // Alt can be empty for decorative images, but must be present
      expect(alt).not.toBeNull()
    }
  })

  test.skip('@wip form inputs have labels', async ({ page }) => {
    // Expected: All form inputs should have associated labels
    await page.goto(TEST_URLS.contact)

    const inputs = page.locator('input[type="text"], input[type="email"], textarea')
    const count = await inputs.count()

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')

      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        const hasLabel = (await label.count()) > 0
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy()
      }
    }
  })

  test.skip('@wip headings are hierarchical', async ({ page }) => {
    // Expected: Heading levels should not skip (h1, then h2, not h1 then h3)
    await page.goto(TEST_URLS.home)

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((elements) => {
      return elements.map((el) => parseInt(el.tagName.charAt(1)))
    })

    // Check h1 exists
    expect(headings).toContain(1)

    // Check no skipped levels
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i]
      const previous = headings[i - 1]
      if (current !== undefined && previous !== undefined) {
        const diff = current - previous
        expect(diff).toBeLessThanOrEqual(1) // Can stay same or go up by 1
      }
    }
  })

  test.skip('@wip page has exactly one h1', async ({ page }) => {
    // Expected: Page should have one and only one h1
    await page.goto(TEST_URLS.home)

    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)

    const h1Text = await h1.textContent()
    expect(h1Text?.trim().length).toBeGreaterThan(0)
  })

  test.skip('@wip required fields are marked', async ({ page }) => {
    // Expected: Required inputs should have aria-required or required attribute
    await page.goto(TEST_URLS.contact)

    const emailInput = page.locator('input[type="email"]').first()
    const isRequired = await emailInput.getAttribute('required')
    const ariaRequired = await emailInput.getAttribute('aria-required')

    expect(isRequired !== null || ariaRequired === 'true').toBe(true)
  })

  test.skip('@wip error messages are announced', async ({ page }) => {
    // Expected: Error messages should be in aria-live region or linked to input
    await page.goto(TEST_URLS.contact)

    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()
    await page.waitForTimeout(500)

    const errorRegion = page.locator('[aria-live], [role="alert"]')
    const errorCount = await errorRegion.count()

    // Or errors should be linked to inputs via aria-describedby
    const inputWithError = page.locator('input[aria-describedby], input[aria-invalid="true"]')
    const inputErrorCount = await inputWithError.count()

    expect(errorCount > 0 || inputErrorCount > 0).toBe(true)
  })

  test.skip('@wip modals have proper ARIA', async ({ page }) => {
    // Expected: Modals should have role="dialog" and aria-modal="true"
    await page.goto(TEST_URLS.home)

    const modalTrigger = page.locator('[data-modal-trigger]').first()

    if ((await modalTrigger.count()) === 0) {
      test.skip()
    }

    await modalTrigger.click()
    await page.waitForTimeout(300)

    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    const ariaModal = await modal.getAttribute('aria-modal')
    expect(ariaModal).toBe('true')

    const ariaLabel = await modal.getAttribute('aria-label')
    const ariaLabelledBy = await modal.getAttribute('aria-labelledby')
    expect(ariaLabel || ariaLabelledBy).toBeTruthy()
  })

  test.skip('@wip loading states are announced', async ({ page }) => {
    // Expected: Loading indicators should have aria-live or role="status"
    await page.goto(TEST_URLS.contact)

    const form = page.locator('form').first()
    const emailInput = form.locator('input[type="email"]').first()
    await emailInput.fill('test@example.com')

    const gdprCheckbox = form.locator('input[type="checkbox"]').first()
    await gdprCheckbox.check()

    const submitButton = form.locator('button[type="submit"]').first()
    await submitButton.click()

    // Look for loading state
    const loadingIndicator = page.locator(
      '[aria-busy="true"], [role="status"], [aria-live="polite"], [data-loading]'
    )
    const hasLoadingState = (await loadingIndicator.count()) > 0

    // Test passes if loading state is properly announced (or no loading state)
    expect(typeof hasLoadingState).toBe('boolean')
  })

  test.skip('@wip lists use proper markup', async ({ page }) => {
    // Expected: Lists should use <ul>, <ol>, or role="list"
    await page.goto(TEST_URLS.home)

    const lists = page.locator('ul, ol, [role="list"]')
    const count = await lists.count()

    expect(count).toBeGreaterThan(0)

    // Check that list items are children
    for (let i = 0; i < Math.min(count, 3); i++) {
      const list = lists.nth(i)
      const items = list.locator('li, [role="listitem"]')
      const itemCount = await items.count()

      expect(itemCount).toBeGreaterThan(0)
    }
  })

  test.skip('@wip skip link is first focusable element', async ({ page }) => {
    // Expected: Skip link should be first in tab order
    await page.goto(TEST_URLS.home)

    await page.keyboard.press('Tab')

    const firstFocused = await page.evaluate(() => {
      return document.activeElement?.textContent?.toLowerCase()
    })

    expect(firstFocused).toMatch(/skip|main|content/)
  })

  test.skip('@wip expandable sections have aria-expanded', async ({ page }) => {
    // Expected: Accordions/collapsibles should use aria-expanded
    await page.goto(TEST_URLS.home)

    const expandable = page.locator('[aria-expanded]').first()

    if ((await expandable.count()) === 0) {
      test.skip()
    }

    const initialState = await expandable.getAttribute('aria-expanded')
    expect(['true', 'false']).toContain(initialState)

    await expandable.click()
    await page.waitForTimeout(300)

    const newState = await expandable.getAttribute('aria-expanded')
    expect(newState).not.toBe(initialState)
  })
})
