/**
 * Regression Tests for Astro View Transitions - transition:persist directive
 *
 * Verifies that elements with transition:persist maintain their DOM identity
 * across page navigations when using Astro's View Transitions API.
 *
 * Tests specifically focus on Web Components (like ThemePicker) to verify
 * whether Astro properly handles transition:persist for custom elements.
 *
 * Related:
 * - src/layouts/BaseLayout.astro (ThemePicker with transition:persist)
 * - src/components/ThemePicker/index.astro (Web Component implementation)
 * - Astro View Transitions API documentation
 */

/* eslint-disable custom-rules/enforce-centralized-events -- Test file uses addEventListener to verify DOM persistence */

import { ComponentPersistencePage, test, describe, expect } from '@test/e2e/helpers'

describe('View Transitions - transition:persist on Web Components', () => {
  test('should persist ThemePicker web component identity across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = new ComponentPersistencePage(playwrightPage)

    await page.goto('/')

    // Set up test data on the ThemePicker web component
    const initialData = await page.setupPersistenceTest('theme-picker')

    // Navigate to a different page using Astro's View Transitions
    await page.navigateToPage('/articles')
    await page.waitForURL('**/articles', { timeout: 5000 })
    await page.waitForPageLoad()

    // Verify the element persisted with the same DOM identity
    const afterNavigationData = await page.verifyPersistence('theme-picker')

    // Run all persistence assertions
    page.assertPersistence(initialData, afterNavigationData)

    // Output console messages for debugging
    page.printCapturedMessages('ALL CAPTURED CONSOLE MESSAGES')
  })

  test('should preserve event listeners and closure state across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = new ComponentPersistencePage(playwrightPage)
    await page.goto('/')

    // Attach an event listener with closure state to the ThemePicker component
    // This tests whether the DOM element truly persists (event listeners would be lost on recreation)
    const initialClickCount = await page.evaluate(() => {
      const element = document.querySelector('theme-picker')
      if (!element) throw new Error('theme-picker web component not found')

      let clickCount = 0

      const handleClick = () => {
        clickCount++
        ;(element as any).__clickCount = clickCount
      }

      // Attach listener to the web component
      element.addEventListener('click', handleClick)

      // Mark that listener was attached
      ;(element as any).__listenerAttached = true
      ;(element as any).__clickCount = 0

      return clickCount
    })

    expect(initialClickCount).toBe(0)

    // Navigate using View Transitions (not full reload)
    await page.navigateToPage('/articles')
    await page.waitForURL('**/articles', { timeout: 5000 })
    await page.waitForPageLoad()

    // Programmatically dispatch a click event to trigger the listener
    const afterNavigationData = await page.evaluate(() => {
      const element = document.querySelector('theme-picker')
      if (!element) throw new Error('theme-picker web component not found after navigation')

      // Dispatch synthetic click event
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      // Return the state
      return {
        listenerAttached: (element as any).__listenerAttached,
        clickCount: (element as any).__clickCount,
      }
    })

    // If the element was destroyed and recreated, the listener would be lost
    // and clickCount would be undefined (not 1)
    expect(afterNavigationData.listenerAttached).toBe(true)
    expect(afterNavigationData.clickCount).toBe(1)
  })
})
