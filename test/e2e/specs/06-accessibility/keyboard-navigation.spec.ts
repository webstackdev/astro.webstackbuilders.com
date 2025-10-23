/**
 * Keyboard Navigation Tests
 * Tests for keyboard accessibility including tab order and focus management
 */

import { test, expect } from '@test/e2e/helpers'


test.describe('Keyboard Navigation', () => {
  test.skip('@wip can tab through all interactive elements', async ({ page }) => {
    // Expected: All interactive elements should be reachable via Tab
    await page.goto('/')

    let focusableCount = 0
    const maxTabs = 50

    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => document.activeElement?.tagName)
      if (focused && ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(focused)) {
        focusableCount++
      }
    }

    expect(focusableCount).toBeGreaterThan(5)
  })

  test.skip('@wip skip to main content link works', async ({ page }) => {
    // Expected: Should have skip link that jumps to main content
    await page.goto('/')

    // Tab to first element (should be skip link)
    await page.keyboard.press('Tab')

    const skipLink = page.locator('a[href="#main-content"], a[href="#main"], a:has-text("Skip")')
    if ((await skipLink.count()) > 0) {
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)

      // Focus should be on main content
      const focused = await page.evaluate(() => document.activeElement?.id)
      expect(focused).toMatch(/main|content/)
    }
  })

  test.skip('@wip focus indicators are visible', async ({ page }) => {
    // Expected: Focused elements should have visible outline
    await page.goto('/')

    // Tab to first interactive element
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    const focused = await page.evaluate(() => {
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

  test.skip('@wip tab order follows visual layout', async ({ page }) => {
    // Expected: Tab order should be logical (top to bottom, left to right)
    await page.goto('/')

    const positions = []

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const pos = await page.evaluate(() => {
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

    expect(lastY).toBeGreaterThanOrEqual(firstY - 100) // Allow some tolerance
  })

  test.skip('@wip can navigate menu with keyboard', async ({ page }) => {
    // Expected: Navigation menu should be keyboard accessible
    await page.goto('/')

    // Tab to navigation
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    // Press Enter on a nav link
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Should have navigated
    const url = page.url()
    expect(url).not.toBe('/')
  })

  test.skip('@wip can close modals with Escape', async ({ page }) => {
    // Expected: Modal dialogs should close with Escape key
    await page.goto('/')

    // Open a modal (if available)
    const modalTrigger = page.locator('[data-modal-trigger], [data-dialog-trigger]').first()

    if ((await modalTrigger.count()) === 0) {
      test.skip()
    }

    await modalTrigger.click()
    await page.waitForTimeout(300)

    const modal = page.locator('[role="dialog"], [data-modal]')
    await expect(modal.first()).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    await expect(modal.first()).not.toBeVisible()
  })

  test.skip('@wip form inputs are keyboard accessible', async ({ page }) => {
    // Expected: Can fill form using only keyboard
    await page.goto('/contact')

    // Tab to email input
    let emailFocused = false
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => document.activeElement?.getAttribute('type'))
      if (focused === 'email') {
        emailFocused = true
        break
      }
    }

    expect(emailFocused).toBe(true)

    // Type in email
    await page.keyboard.type('test@example.com')

    const emailInput = page.locator('input[type="email"]').first()
    const value = await emailInput.inputValue()
    expect(value).toBe('test@example.com')
  })

  test.skip('@wip can submit form with Enter key', async ({ page }) => {
    // Expected: Pressing Enter in form should submit
    await page.goto('/contact')

    const emailInput = page.locator('input[type="email"]').first()
    await emailInput.fill('test@example.com')

    // Tab to GDPR checkbox
    const gdprCheckbox = page.locator('input[type="checkbox"]').first()
    await gdprCheckbox.check()

    // Press Enter
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Form should show validation or submit
    const hasError = await page.locator('[data-error], .error').count()
    const hasSuccess = await page.locator('[data-success], .success').count()

    expect(hasError > 0 || hasSuccess > 0).toBe(true)
  })

  test.skip('@wip dropdowns work with arrow keys', async ({ page }) => {
    // Expected: Select dropdowns should work with arrow keys
    await page.goto('/contact')

    const select = page.locator('select').first()

    if ((await select.count()) === 0) {
      test.skip()
    }

    await select.focus()
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(300)

    const value = await select.inputValue()
    expect(value).toBeTruthy()
  })

  test.skip('@wip links are activatable with Enter', async ({ page }) => {
    // Expected: Links should activate with Enter key
    await page.goto('/')

    // Tab to first link
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab')
    }

    const initialUrl = page.url()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)

    // Should have navigated
    const newUrl = page.url()
    expect(newUrl).not.toBe(initialUrl)
  })

  test.skip('@wip carousel is keyboard navigable', async ({ page }) => {
    // Expected: Carousel should work with arrow keys
    await page.goto('/')

    const carousel = page.locator('[data-carousel]').first()
    await carousel.focus()

    const initialSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(500)

    const newSlide = await carousel.evaluate((el) => {
      return el.querySelector('[aria-current="true"]')?.getAttribute('data-index')
    })

    expect(newSlide).not.toBe(initialSlide)
  })

  test.skip('@wip can tab backwards with Shift+Tab', async ({ page }) => {
    // Expected: Shift+Tab should move focus backwards
    await page.goto('/')

    // Tab forward a few times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    const forwardElement = await page.evaluate(() => document.activeElement?.outerHTML)

    // Tab backward twice
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')

    const backwardElement = await page.evaluate(() => document.activeElement?.outerHTML)

    expect(backwardElement).not.toBe(forwardElement)
  })

  test.skip('@wip checkboxes toggle with Space', async ({ page }) => {
    // Expected: Checkboxes should toggle with Space key
    await page.goto('/contact')

    const checkbox = page.locator('input[type="checkbox"]').first()
    await checkbox.focus()

    const initialChecked = await checkbox.isChecked()

    await page.keyboard.press('Space')
    await page.waitForTimeout(300)

    const newChecked = await checkbox.isChecked()
    expect(newChecked).toBe(!initialChecked)
  })
})
