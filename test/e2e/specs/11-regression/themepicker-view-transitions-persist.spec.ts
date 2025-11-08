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

import { BasePage, test, describe, expect } from '@test/e2e/helpers'
import { setupConsoleCapture, printCapturedMessages } from '@test/e2e/helpers/consoleCapture'

describe('View Transitions - transition:persist on Web Components', () => {
  test('should persist ThemePicker web component identity across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = new BasePage(playwrightPage)

    // Capture all console output including nested group content
    const consoleMessages = setupConsoleCapture(playwrightPage, true)

    await page.goto('/')

    // Set a unique identifier on the ThemePicker web component and store a custom property
    const initialData = await page.evaluate(() => {
      const element = document.querySelector('theme-picker') as HTMLElement
      if (!element) throw new Error('theme-picker web component not found')

      // Create a unique identifier
      const uniqueId = `test-${Date.now()}-${Math.random()}`

      // Set it as a data attribute
      element.setAttribute('data-unique-id', uniqueId)

      // Also set a custom property directly on the DOM element
      // This is more definitive proof of DOM identity persistence
      ;(element as any).__testProperty = uniqueId

      // Store a counter to verify the element isn't recreated
      ;(element as any).__navigationCounter = 0

      return {
        uniqueId,
        initialTimestamp: Date.now(),
        tagName: element.tagName.toLowerCase(),
      }
    })

    // Navigate to a different page using Astro's View Transitions
    // Click the Articles link in the main navigation to trigger client-side navigation
    await page.navigateToPage('/articles')

    // Wait for the View Transition to complete and URL to change
    await page.waitForURL('**/articles', { timeout: 5000 })

    // Wait for Astro page load event instead of arbitrary timeout
    await page.waitForPageLoad()

    // Verify the element still has the same unique identifier
    const afterNavigationData = await page.evaluate(() => {
      const element = document.querySelector('theme-picker') as HTMLElement
      if (!element) throw new Error('theme-picker web component not found after navigation')

      // Increment counter to prove it's the same element
      const counter = (element as any).__navigationCounter
      ;(element as any).__navigationCounter = counter + 1

      return {
        dataAttribute: element.getAttribute('data-unique-id'),
        customProperty: (element as any).__testProperty,
        navigationCounter: counter,
        elementExists: !!element,
        tagName: element.tagName.toLowerCase(),
      }
    })

    // Assertions proving DOM identity persistence
    expect(afterNavigationData.elementExists).toBe(true)
    expect(afterNavigationData.tagName).toBe('theme-picker')
    expect(afterNavigationData.dataAttribute).toBe(initialData.uniqueId)
    expect(afterNavigationData.customProperty).toBe(initialData.uniqueId)
    expect(afterNavigationData.navigationCounter).toBe(0) // Should still be 0 if element persisted

    // Output all captured console messages for analysis
    printCapturedMessages(consoleMessages, 'ALL CAPTURED CONSOLE MESSAGES')
  })

  test.skip('should maintain custom properties across multiple navigations', async ({
    page: playwrightPage,
  }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')

    // Set multiple custom properties on the ThemePicker web component
    const testData = await page.evaluate(() => {
      const element = document.querySelector('theme-picker') as HTMLElement
      if (!element) throw new Error('theme-picker web component not found')

      const data = {
        id: `id-${Math.random()}`,
        counter: 42,
        timestamp: Date.now(),
        nested: { value: 'test' },
      }

      // Store various types of data on the element
      ;(element as any).__testData = data

      return data
    })

    // Navigate through multiple pages
    const pages = ['/about', '/articles', '/services', '/contact']

    for (const pagePath of pages) {
      await page.goto(pagePath)

      // Verify the custom property persists
      const currentData = await page.evaluate(() => {
        const element = document.querySelector('theme-picker') as HTMLElement
        return (element as any).__testData
      })

      expect(currentData).toEqual(testData)
    }
  })

  test.skip('should preserve internal state of web component across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')

    // Modify internal state of the ThemePicker component
    await page.evaluate(() => {
      const element = document.querySelector('theme-picker') as HTMLElement
      if (!element) throw new Error('theme-picker web component not found')

      let clickCount = 0

      const handleClick = () => {
        clickCount++
        ;(element as any).__clickCount = clickCount
      }

      // Note: This is for testing DOM persistence, not production code
      // In production, we use addButtonEventListeners from elementListeners
      element.addEventListener('click', handleClick)

      // Store initial state
      ;(element as any).__listenerAttached = true
      ;(element as any).__clickCount = 0
    })

    // Navigate to another page
    await page.goto('/about')

    // Click the element and verify internal state persists
    await playwrightPage.locator('theme-picker').click()

    const listenerData = await page.evaluate(() => {
      const element = document.querySelector('theme-picker') as HTMLElement
      return {
        listenerAttached: (element as any).__listenerAttached,
        clickCount: (element as any).__clickCount,
      }
    })

    expect(listenerData.listenerAttached).toBe(true)
    expect(listenerData.clickCount).toBe(1) // Should have incremented from the click
  })

  test('should maintain element reference across navigation', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')

    // Store a reference test on ThemePicker - advanced verification of identity persistence
    const refCheck = await page.evaluate(() => {
      const element = document.querySelector('theme-picker') as HTMLElement
      if (!element) throw new Error('theme-picker web component not found')

      // Create a unique symbol that can only exist on the same object reference
      const uniqueSymbol = Symbol('test-identity')
      ;(element as any)[uniqueSymbol] = 'identity-marker'

      // Store the symbol key as a string for later comparison
      ;(element as any).__symbolKey = uniqueSymbol.toString()
      ;(element as any).__symbolValue = 'identity-marker'

      return {
        symbolKey: uniqueSymbol.toString(),
        tagName: element.tagName.toLowerCase(),
      }
    })

    // Navigate using View Transitions
    await page.navigateToPage('/articles')
    await page.waitForURL('**/articles', { timeout: 5000 })
    await page.waitForPageLoad()

    // Check if the symbol property still exists (proves same object reference)
    const afterNav = await page.evaluate(() => {
      const element = document.querySelector('theme-picker') as HTMLElement
      return {
        symbolKey: (element as any).__symbolKey,
        symbolValue: (element as any).__symbolValue,
        tagName: element.tagName.toLowerCase(),
      }
    })

    expect(afterNav.tagName).toBe('theme-picker')
    expect(afterNav.symbolKey).toBe(refCheck.symbolKey)
    expect(afterNav.symbolValue).toBe('identity-marker')
  })
})
