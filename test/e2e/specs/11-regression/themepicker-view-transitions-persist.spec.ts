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

import { ComponentPersistencePage, BasePage, test, describe, expect } from '@test/e2e/helpers'

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
})
