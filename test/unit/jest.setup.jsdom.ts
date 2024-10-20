/**
 * This file is called by `setupFilesAfterEnv`, which is executed before each test
 * file is executed but after the testing framework is installed in the environment.
 * The `beforeAll` and `beforeEach` Jest globals are called with resets for the
 * JSDOM environment, which otherwise would retain state between tests (document object).
 */
import { beforeEach, expect, jest } from '@jest/globals'
import { toHaveNoViolations } from 'jest-axe'
import { setQuietMode, unsetQuietMode } from './jsdomQuietMode'
import * as reset from './environment/reset'
import './utils/extendMatchers'

/** Add `jest-dom` to JSDom environment browser globals */
import '@testing-library/jest-dom'
import '@testing-library/jest-dom/extend-expect'

/** Add mocked local and session storage */
import 'jest-localstorage-mock'

/** Add Axe accessibility expectations to global expect object */
expect.extend(toHaveNoViolations)

/** JSDOM tests suites with lots of tests and worker threads exceed default 5s timeout */
jest.setTimeout(30 * 1000)

/**
 * Soft reset for JSDOM environment and globals. Removes side effects from tests,
 * but does  not reset all changes made to globals like the window and document
 * objects. Tests requiring a full JSDOM reset should be stored in separate files
 * which does a complete JSDOM reset with Jest.
 *
 * - Removes event listeners added to document and window during tests
 * - Removes keys added to document and window object during tests
 * - Remove attributes on <html> element
 * - Removes all DOM elements
 * - Resets document.documentElement HTML to <head></head><body></body>
 *
 * Suppress console output from JSDOM's browser console outlet to avoid a wall of red
 * error messages in tests that intentionally throw, but allow enabling for debugging.
 *
 * @example add pragma at top of file in a docblock:
 * @jest-environment-options {"JSDOM_QUIET_MODE": false}
 * @jest-environment-options {"something_else": false}
 */

beforeEach(() => {
  const rootElement = document.documentElement
  reset.removeRootAttributes(rootElement)
  reset.removeRootChildElements(rootElement)
  reset.restoreRootBaseElements(rootElement)
  reset.removeTrackedGlobalEventListeners()
  reset.removeGlobalProperties()
  /** Whether script running in JSDOM sandbox should output to the console */
  setQuietMode({ isQuietMode: !!globalThis.JSDOM_QUIET_MODE }, jest)
  /** Fully reset the stubbed local and session storage state between tests */
  localStorage.clear()
  /**
   * Reset cookies between tests. No access to tough-cookie CookieJar instance here:
   * https://github.com/jsdom/jsdom/blob/04f6c13f4a4d387c7fc979b8f62c6f68d8a0c639/lib/api.js#L58
   */
  type KeyValueTuple = [key: string, value: string]
  document.cookie.split('; ').forEach(keyValue => {
    const tuple: KeyValueTuple = keyValue.split('=') as KeyValueTuple
    document.cookie = `${tuple[0]}=;Max-Age=-99999999;`
  })
})

afterEach(() => {
  unsetQuietMode({ isQuietMode: !!globalThis.JSDOM_QUIET_MODE })
})
