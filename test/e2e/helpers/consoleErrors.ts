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
    getFilteredErrors: () => {
      // Get list of acceptable 404 URLs (strip resource type suffix)
      const acceptable404Urls = failed404s.filter((url) => {
        const urlWithoutType = url.split(' (')[0]
        return url.includes('favicon.ico') || urlWithoutType?.endsWith('/')
      })

      return consoleErrors.filter((error) => {
        // Filter known browser quirks
        if (error.includes('ResizeObserver loop completed')) return false

        // Filter Vite dev server 504 errors (Outdated Optimize Dep)
        if (error.includes('504') && error.includes('Outdated Optimize Dep')) return false

        // Filter generic "Failed to load resource: 404" errors if we have acceptable 404s
        // These console errors don't include the URL, so if we filtered out 404s,
        // we should also filter out the corresponding console errors
        if (
          error.includes('Failed to load resource') &&
          error.includes('404') &&
          acceptable404Urls.length > 0 &&
          failed404s.every((url) => acceptable404Urls.includes(url))
        ) {
          return false
        }

        return true
      })
    },
    getFiltered404s: () =>
      failed404s.filter((url) => {
        // favicon 404s are acceptable in dev
        if (url.includes('favicon.ico')) return false

        // Trailing slash 404s are expected (astro config: trailingSlash: 'never')
        // URL format is: "http://localhost:4321/path/ (resourceType)"
        const urlWithoutType = url.split(' (')[0]
        if (urlWithoutType?.endsWith('/')) return false

        return true
      }),
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
