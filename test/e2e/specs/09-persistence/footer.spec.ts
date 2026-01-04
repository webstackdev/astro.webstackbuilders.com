/**
 * Component Persistence Tests for Footer Component
 *
 * Verifies that the Footer component maintains DOM identity across
 * page navigations when using Astro's View Transitions API with transition:persist.
 *
 * These tests are implementation-agnostic and should work for both:
 * - Current implementation ([data-testid="footer-component"])
 * - Future Web Component implementation (footer-component or similar)
 *
 * Related:
 * - src/components/Footer (Footer component implementation)
 * - Astro View Transitions API documentation
 */

/* eslint-disable custom-rules/enforce-centralized-events -- Test file uses addEventListener to verify DOM persistence */

import { ComponentPersistencePage, test, describe, expect } from '@test/e2e/helpers'
import { wait } from '@test/e2e/helpers/waitTimeouts'

const FOOTER_SELECTOR = '[data-testid="footer-component"], site-footer'

describe('Footer Component Persistence', () => {
  test('should persist Footer component identity across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = await ComponentPersistencePage.init(playwrightPage)
    await page.goto('/')

    // Set up test data on the Footer component (works for both Preact and Web Component)
    const initialData = await page.setupPersistenceTest(FOOTER_SELECTOR)

    // Navigate to a different page using Astro View Transitions
    await page.navigateToPage('/articles')
    await page.waitForURL('**/articles', { timeout: wait.defaultWait })
    await page.waitForPageLoad()

    // Verify the element persisted with the same DOM identity
    const afterNavigationData = await page.verifyPersistence(FOOTER_SELECTOR)

    // Run all persistence assertions
    page.assertPersistence(initialData, afterNavigationData)
  })

  test('should preserve event listeners and closure state across navigation', async ({
    page: playwrightPage,
  }) => {
    const page = await ComponentPersistencePage.init(playwrightPage)
    await page.goto('/')

    // Attach an event listener with closure state to the Footer component
    const initialClickCount = await page.evaluate((selector: string) => {
      const EvaluationErrorCtor = window.EvaluationError!
      const element = document.querySelector(selector)
      if (!element) {
        throw new EvaluationErrorCtor(`Footer component (${selector}) not found`)
      }

      let clickCount = 0

      const handleClick = () => {
        clickCount++
        ;(element as any).__clickCount = clickCount
      }

      element.addEventListener('click', handleClick)

      ;(element as any).__listenerAttached = true
      ;(element as any).__clickCount = 0

      return clickCount
    }, FOOTER_SELECTOR)

    expect(initialClickCount).toBe(0)

    // Navigate using View Transitions
    await page.navigateToPage('/articles')
    await page.waitForURL('**/articles', { timeout: wait.defaultWait })
    await page.waitForPageLoad()

    // Dispatch click event to trigger the listener
    const afterNavigationData = await page.evaluate((selector: string) => {
      const EvaluationErrorCtor = window.EvaluationError!
      const element = document.querySelector(selector)
      if (!element) {
        throw new EvaluationErrorCtor(`Footer component (${selector}) not found after navigation`)
      }

      element.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      return {
        listenerAttached: (element as any).__listenerAttached,
        clickCount: (element as any).__clickCount,
      }
    }, FOOTER_SELECTOR)

    expect(afterNavigationData.listenerAttached).toBe(true)
    expect(afterNavigationData.clickCount).toBe(1)
  })
})
