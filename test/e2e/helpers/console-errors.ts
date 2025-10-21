/**
 * Helper utilities for checking console errors and network failures in E2E tests
 */
import { type Page } from '@playwright/test'

export interface ConsoleErrorChecker {
  consoleErrors: string[]
  failed404s: string[]
  getFilteredErrors: () => string[]
  getFiltered404s: () => string[]
}

/**
 * Setup listeners and check for console errors and 404s on a page
 * Call this BEFORE navigating to the page you want to test
 *
 * @param page - Playwright page instance
 * @returns Object with arrays of errors and filtered results
 *
 * @example
 * const errorChecker = setupConsoleErrorChecker(page)
 * await page.goto('/some-page')
 * await page.waitForLoadState('networkidle')
 * logConsoleErrors(errorChecker)
 * expect(errorChecker.getFilteredErrors()).toHaveLength(0)
 * expect(errorChecker.getFiltered404s()).toHaveLength(0)
 */
export function setupConsoleErrorChecker(page: Page): ConsoleErrorChecker {
  const consoleErrors: string[] = []
  const failed404s: string[] = []

  // Capture 404 responses with full details
  page.on('response', (response) => {
    if (response.status() === 404) {
      const url = response.url()
      const requestType = response.request().resourceType()
      failed404s.push(`${url} (${requestType})`)
    }
  })

  // Capture ALL console messages of type error
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      consoleErrors.push(text)
    }
  })

  // Also capture page errors (uncaught exceptions)
  page.on('pageerror', (error) => {
    consoleErrors.push(`Uncaught: ${error.message}\n${error.stack}`)
  })

  return {
    consoleErrors,
    failed404s,
    // Filter out ONLY known acceptable issues - computed lazily
    getFilteredErrors: () =>
      consoleErrors.filter(
        (error) =>
          !error.includes('ResizeObserver loop completed') // Known browser quirk
      ),
    getFiltered404s: () =>
      failed404s.filter(
        (url) =>
          !url.includes('favicon.ico') // favicon 404s are acceptable in dev
      ),
  }
}

/**
 * Log any console errors or 404s found during the test
 * Call this after page navigation and before assertions
 *
 * @param errorChecker - The error checker object returned from setupConsoleErrorChecker
 *
 * @example
 * logConsoleErrors(errorChecker)
 */
export function logConsoleErrors(errorChecker: ConsoleErrorChecker): void {
  // Always log what we found for debugging
  if (errorChecker.failed404s.length > 0) {
    console.log('\n🔍 404 Resources:')
    errorChecker.failed404s.forEach((url) => console.log(`  - ${url}`))
  }
  if (errorChecker.consoleErrors.length > 0) {
    console.log('\n❌ Console Errors:')
    errorChecker.consoleErrors.forEach((error) => {
      // Log full error message for diagnosis
      console.log(`  - ${error}`)
    })
  }

  // Log filtered results
  const filtered404s = errorChecker.getFiltered404s()
  const filteredErrors = errorChecker.getFilteredErrors()

  if (filtered404s.length > 0) {
    console.error('\n💥 Unexpected 404 resources found!')
  }
  if (filteredErrors.length > 0) {
    console.error('\n💥 Unexpected console errors found!')
  }
}
