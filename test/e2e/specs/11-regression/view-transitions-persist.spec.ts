/**
 * Regression Tests for Astro View Transitions - transition:persist directive
 *
 * Verifies that elements with transition:persist maintain their DOM identity
 * across page navigations when using Astro's View Transitions API.
 *
 * Related:
 * - src/layouts/BaseLayout.astro (view-transition test element)
 * - Astro View Transitions API documentation
 */

import { BasePage, test, describe, expect } from '@test/e2e/helpers'

describe('View Transitions - transition:persist', () => {
  test('should persist DOM element identity across navigation', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')

    // Set a unique identifier on the element and store a custom property
    const initialData = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="view-transition"]') as HTMLElement
      if (!element) throw new Error('view-transition element not found')

      // Create a unique identifier
      const uniqueId = `test-${Date.now()}-${Math.random()}`

      // Set it as a data attribute
      element.setAttribute('data-unique-id', uniqueId)

      // Also set a custom property directly on the DOM element
      // This is more definitive proof of DOM identity persistence
      ;(element as any).__testProperty = uniqueId

      return {
        uniqueId,
        initialTimestamp: Date.now(),
      }
    })

    // Navigate to a different page
    await page.goto('/about')

    // Verify the element still has the same unique identifier
    const afterNavigationData = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="view-transition"]') as HTMLElement
      if (!element) throw new Error('view-transition element not found after navigation')

      return {
        dataAttribute: element.getAttribute('data-unique-id'),
        customProperty: (element as any).__testProperty,
        elementExists: !!element,
      }
    })

    // Assertions proving DOM identity persistence
    expect(afterNavigationData.elementExists).toBe(true)
    expect(afterNavigationData.dataAttribute).toBe(initialData.uniqueId)
    expect(afterNavigationData.customProperty).toBe(initialData.uniqueId)
  })

  test.skip('should maintain custom properties across multiple navigations', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')

    // Set multiple custom properties on the element
    const testData = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="view-transition"]') as HTMLElement
      if (!element) throw new Error('view-transition element not found')

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
        const element = document.querySelector('[data-testid="view-transition"]') as HTMLElement
        return (element as any).__testData
      })

      expect(currentData).toEqual(testData)
    }
  })

  test.skip('should preserve event listener state across navigation', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')

    // Add an event listener and track if it fires
    await page.evaluate(() => {
      const element = document.querySelector('[data-testid="view-transition"]') as HTMLElement
      if (!element) throw new Error('view-transition element not found')

      let clickCount = 0

      const handleClick = () => {
        clickCount++
        ;(element as any).__clickCount = clickCount
      }

      element.addEventListener('click', handleClick)

      // Store initial state
      ;(element as any).__listenerAttached = true
      ;(element as any).__clickCount = 0
    })

    // Navigate to another page
    await page.goto('/about')

    // Click the element and verify the listener still works
    await playwrightPage.locator('[data-testid="view-transition"]').click()

    const listenerData = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="view-transition"]') as HTMLElement
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

    // Store a WeakMap reference test - more advanced verification
    const refCheck = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="view-transition"]') as HTMLElement
      if (!element) throw new Error('view-transition element not found')

      // Create a unique symbol that can only exist on the same object reference
      const uniqueSymbol = Symbol('test-identity')
      ;(element as any)[uniqueSymbol] = 'identity-marker'

      // Store the symbol key as a string for later comparison
      ;(element as any).__symbolKey = uniqueSymbol.toString()
      ;(element as any).__symbolValue = 'identity-marker'

      return {
        symbolKey: uniqueSymbol.toString(),
      }
    })

    // Navigate
    await page.goto('/about')

    // Check if the symbol property still exists
    const afterNav = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="view-transition"]') as HTMLElement
      return {
        symbolKey: (element as any).__symbolKey,
        symbolValue: (element as any).__symbolValue,
      }
    })

    expect(afterNav.symbolKey).toBe(refCheck.symbolKey)
    expect(afterNav.symbolValue).toBe('identity-marker')
  })
})
