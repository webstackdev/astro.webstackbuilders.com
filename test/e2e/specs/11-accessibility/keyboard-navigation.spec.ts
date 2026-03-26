/**
 * Keyboard Navigation Tests
 * Tests for keyboard accessibility including tab order and focus management
 */

import { BasePage, describe, test, expect } from '@test/e2e/helpers'
import { runAcrossPages } from '@test/e2e/helpers/runAcrossPages'

describe('Keyboard Navigation', () => {

  /**
   * Axe does not check for tabbing through interactive elements. It checks that
   * tabindex value greater than 0, as this can create an illogical and confusing
   * tab order for keyboard-only users. It identifies instances where a focusable
   * element is nested within another interactive control (e.g., a link inside a
   * button). This can prevent screen readers from announcing the nested element
   * and create an empty tab stop.
   */
  test('@ready can tab through interactive elements', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await runAcrossPages(page, 'check touch targets', async (url) => {
      await page.goto(url)

      let focusableCount = 0
      const maxTabs = 50

      for (let i = 0; i < maxTabs; i++) {
        await page.pressKey('Tab')
        const focused = await page.evaluate(() => document.activeElement?.tagName)
        if (focused && ['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(focused)) {
          focusableCount++
        }
      }

      expect(focusableCount).toBeGreaterThan(5)
    })
  })

  /**
   * Axe does not check that tab order follows the visual layout. An automated tool
   * cannot accurately determine the visual flow of a page because this is a subjective
   * task that requires human interpretation.
   */
  test('@ready form inputs are keyboard accessible', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')

    // Dismiss cookie modal if it's open (common in test environments)
    const consentModalVisible = await page.evaluate(() => {
      const modal = document.getElementById('consent-modal-id')
      return modal ? window.getComputedStyle(modal).display !== 'none' : false
    })

    if (consentModalVisible) {
      // Click the "Allow All" button to dismiss the modal
      await page.page.click('.consent-modal__btn-allow')
      // Wait for modal to close and main content to be restored
      await page.page.waitForFunction(() => {
        const modal = document.getElementById('consent-modal-id')
        const main = document.getElementById('main-content')
        return modal && window.getComputedStyle(modal).display === 'none' &&
               main && !main.hasAttribute('inert')
      })
    }

    // Tab to email input
    let emailFocused = false
    for (let i = 0; i < 20; i++) {
      await page.pressKey('Tab')
      const focused = await page.evaluate(() => document.activeElement?.getAttribute('type'))
      if (focused === 'email') {
        emailFocused = true
        break
      }
    }

    expect(emailFocused).toBe(true)    // Type in email
    await page.page.keyboard.type('test@example.com')

    const emailInput = page.page.locator('input[type="email"]').first()
    const value = await emailInput.inputValue()
    expect(value).toBe('test@example.com')
  })
})
