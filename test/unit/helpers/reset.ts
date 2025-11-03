import { beforeEach } from 'vitest'

/**
 * Cookie storage for happy-dom
 * Overcomes happy-dom's limitation of only storing one cookie at a time
 */
const cookieStorage = new Map<string, string>()

/**
 * Setup proper cookie handling for happy-dom
 * This overcomes happy-dom's broken cookie implementation
 */
function setupCookieMock() {
  // Override document.cookie with a getter/setter that uses our storage
  Object.defineProperty(document, 'cookie', {
    get() {
      // Return all cookies as a semicolon-separated string
      return Array.from(cookieStorage.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ')
    },
    set(cookieString: string) {
      // Parse the cookie string and store it
      const [nameValue] = cookieString.split(';')
      if (!nameValue) return

      const [name, value] = nameValue.split('=')
      if (!name) return

      const trimmedName = name.trim()
      const trimmedValue = value?.trim() ?? ''

      // Check if this is a deletion (empty value or expired)
      if (!trimmedValue || cookieString.includes('expires=Thu, 01 Jan 1970')) {
        cookieStorage.delete(trimmedName)
      } else {
        cookieStorage.set(trimmedName, trimmedValue)
      }
    },
    configurable: true,
  })
}

/**
 * Helper to set up a clean DOM environment before each test
 * Clears document body, cookies, localStorage, and sessionStorage
 *
 * Note: This works with the happy-dom test environment by clearing
 * the existing global window/document rather than creating a new instance
 */
export function commonSetup() {
  beforeEach(() => {
    // Clear document body
    if (document.body) {
      document.body.innerHTML = ''
    }

    // Clear cookie storage and setup mock
    cookieStorage.clear()
    setupCookieMock()

    // Clear storage
    localStorage.clear()
    sessionStorage.clear()
  })
}
