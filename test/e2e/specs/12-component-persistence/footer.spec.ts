/**
 * Component Persistence Tests for Footer Component
 *
 * Verifies that the Footer component maintains DOM identity across
 * page navigations when using Astro's View Transitions API with transition:persist.
 *
 * These tests are implementation-agnostic and should work for both:
 * - Current Preact implementation ([data-testid="footer-preact"])
 * - Future Web Component implementation (footer-component or similar)
 *
 * Related:
 * - src/components/Footer (Footer component implementation)
 * - Astro View Transitions API documentation
 */

/* eslint-disable custom-rules/enforce-centralized-events -- Test file uses addEventListener to verify DOM persistence */

import { ComponentPersistencePage, test, describe, expect } from '@test/e2e/helpers'

describe('Footer Component Persistence', () => {
  test('should persist Footer component identity across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = new ComponentPersistencePage(playwrightPage)
    await page.goto('/')

    // Set up test data on the Footer component (works for both Preact and Web Component)
    const initialData = await page.setupPersistenceTest('[data-testid="footer-preact"]')

    // Navigate to a different page using Astro View Transitions
    await page.navigateToPage('/articles')
    await page.waitForURL('**/articles', { timeout: 5000 })
    await page.waitForPageLoad()

    // Verify the element persisted with the same DOM identity
    const afterNavigationData = await page.verifyPersistence('[data-testid="footer-preact"]')

    // Run all persistence assertions
    page.assertPersistence(initialData, afterNavigationData)
  })

  test('should preserve event listeners and closure state across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = new ComponentPersistencePage(playwrightPage)
    await page.goto('/')

    // Attach an event listener with closure state to the Footer component
    const initialClickCount = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="footer-preact"]')
      if (!element) throw new Error('Footer component not found')

      let clickCount = 0

      const handleClick = () => {
        clickCount++
        ;(element as any).__clickCount = clickCount
      }

      element.addEventListener('click', handleClick)

      ;(element as any).__listenerAttached = true
      ;(element as any).__clickCount = 0

      return clickCount
    })

    expect(initialClickCount).toBe(0)

    // Navigate using View Transitions
    await page.navigateToPage('/articles')
    await page.waitForURL('**/articles', { timeout: 5000 })
    await page.waitForPageLoad()

    // Dispatch click event to trigger the listener
    const afterNavigationData = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="footer-preact"]')
      if (!element) throw new Error('Footer component not found after navigation')

      element.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      return {
        listenerAttached: (element as any).__listenerAttached,
        clickCount: (element as any).__clickCount,
      }
    })

    expect(afterNavigationData.listenerAttached).toBe(true)
    expect(afterNavigationData.clickCount).toBe(1)
  })

  // Legacy tests - skipped, kept for reference during Preact → Web Component migration
  test.skip('OLD: should persist ThemePicker web component identity across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = new ComponentPersistencePage(playwrightPage)
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

    // Navigate to a different page
    await page.goto('/about')

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
  })

  test.skip('OLD: should maintain custom properties across multiple navigations', async ({
    page: playwrightPage,
  }) => {
    const page = new ComponentPersistencePage(playwrightPage)
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

  test.skip('OLD: should preserve internal state of web component across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = new ComponentPersistencePage(playwrightPage)
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

  test.skip('OLD: should maintain element reference across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = new ComponentPersistencePage(playwrightPage)
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

    // Navigate
    await page.goto('/about')

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

  test.skip('OLD: should persist Preact Footer component identity across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = new ComponentPersistencePage(playwrightPage)
    await page.goto('/')

    // Set up test data on the Preact Footer component
    const initialData = await page.setupPersistenceTest('[data-testid="footer-preact"]')

    // Navigate to a different page using Astro View Transitions
    await page.navigateToPage('/articles')
    await page.waitForURL('**/articles', { timeout: 5000 })
    await page.waitForPageLoad()

    // Verify the element persisted with the same DOM identity
    const afterNavigationData = await page.verifyPersistence('[data-testid="footer-preact"]')

    // Run all persistence assertions
    page.assertPersistence(initialData, afterNavigationData)

    // Output console messages for debugging
    page.printCapturedMessages('FOOTER PERSISTENCE TEST CONSOLE')
  })
})
