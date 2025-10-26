/**
 * Keyboard Navigation Tests
 * Tests for keyboard accessibility including tab order and focus management
 */

import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Keyboard Navigation', () => {
  test('@ready can tab through interactive elements', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')

    let focusableCount = 0
    const maxTabs = 50

    for (let i = 0; i < maxTabs; i++) {
      await page.pressKey('Tab')
      const focused = await page.page.evaluate(() => document.activeElement?.tagName)
      if (focused && ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(focused)) {
        focusableCount++
      }
    }

    expect(focusableCount).toBeGreaterThan(5)
  })

  test('@ready focus indicators are visible', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')

    // Tab to first interactive elements
    await page.pressKey('Tab')
    await page.pressKey('Tab')

    const focused = await page.page.evaluate(() => {
      const el = document.activeElement
      if (!el) return null

      const styles = window.getComputedStyle(el)
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      }
    })

    // Should have some focus indicator
    const hasFocusIndicator =
      focused?.outline !== 'none' ||
      focused?.outlineWidth !== '0px' ||
      focused?.boxShadow !== 'none'

    expect(hasFocusIndicator).toBe(true)
  })

  test('@wip tab order follows visual layout', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')

    const positions: Array<{ y: number; x: number }> = []

    for (let i = 0; i < 10; i++) {
      await page.pressKey('Tab')
      const pos = await page.page.evaluate(() => {
        const el = document.activeElement
        if (!el) return null
        const rect = el.getBoundingClientRect()
        return { y: rect.top, x: rect.left }
      })
      if (pos) positions.push(pos)
    }

    // Check that Y positions generally increase (going down the page)
    const firstY = positions[0]?.y || 0
    const lastY = positions[positions.length - 1]?.y || 0

    // Allow some tolerance for elements at same level
    expect(lastY).toBeGreaterThanOrEqual(firstY - 100)
  })

  test('@ready form inputs are keyboard accessible', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/contact')

    // Tab to email input
    let emailFocused = false
    for (let i = 0; i < 20; i++) {
      await page.pressKey('Tab')
      const focused = await page.page.evaluate(() => document.activeElement?.getAttribute('type'))
      if (focused === 'email') {
        emailFocused = true
        break
      }
    }

    expect(emailFocused).toBe(true)

    // Type in email
    await page.page.keyboard.type('test@example.com')

    const emailInput = page.page.locator('input[type="email"]').first()
    const value = await emailInput.inputValue()
    expect(value).toBe('test@example.com')
  })
})
