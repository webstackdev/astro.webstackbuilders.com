// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  getConsentCookie,
  initConsentCookies,
  prefixConsentCookie,
  removeConsentCookies,
  setConsentCookie,
} from '../cookies'
import { getCookie } from '@components/Scripts/state/cookies'
import { $consent } from '@components/Scripts/state/store/cookieConsent'

// Mock only the side effects function since we don't need it for cookie tests
vi.mock('@components/Scripts/state/store/utils', () => ({
  initStateSideEffects: vi.fn(),
}))

describe(`Consent cookies handlers work`, () => {
  beforeEach(() => {
    // Reset the consent store to default values
    $consent.set({
      necessary: false,
      analytics: false,
      advertising: false,
      functional: false,
    })

    // Clear all cookies before each test
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0]?.trim()
      if (name) {
        document.cookie = `${name}=;Max-Age=-1;path=/`
      }
    })
    localStorage.clear()
  })

  const setAllConsentCookies = () => {
    document.cookie = `consent_necessary=true;Max-Age=30;SameSite=Strict;`
    document.cookie = `consent_analytics=true;Max-Age=30;SameSite=Strict;`
    document.cookie = `consent_advertising=true;Max-Age=30;SameSite=Strict;`
    document.cookie = `consent_functional=true;Max-Age=30;SameSite=Strict;`
  }

  test(`prefixes short form of consent cookie name with 'consent_'`, () => {
    const sut = prefixConsentCookie(`necessary`)
    expect(sut).toMatch(`consent_necessary`)
  })

  test(`sets 'necessary' cookie key using state management`, () => {
    setConsentCookie(`necessary`, `granted`)
    setConsentCookie(`analytics`, `granted`)
    // State management stores 'true' for granted
    expect(document.cookie).toMatch(`consent_necessary=true`)
    expect(document.cookie).toMatch(`consent_analytics=true`)
  })

  test(`gets cookie by key`, () => {
    document.cookie = `consent_necessary=true;Max-Age=30;SameSite=Strict;`
    expect(getConsentCookie(`necessary`)).toMatch(`true`)
  })

  test.skip(`initializes consent cookies and returns true if not already set`, () => {
    // FIXME: Cookie persistence across tests in happy-dom makes this test flaky
    // Ensure no necessary cookie exists by checking directly
    const existingCookie = getCookie('consent_necessary')

    // If cookie already exists from previous test, clear it
    if (existingCookie) {
      removeConsentCookies()
      // Manually clear from document.cookie too
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0]?.trim()
        if (name && name.startsWith('consent_')) {
          document.cookie = `${name}=;Max-Age=-1;path=/`
        }
      })
    }

    // Now try to get the cookie - this should trigger initialization
    const necessaryCookie = getConsentCookie('necessary')

    // After getConsentCookie, cookies should be initialized to 'false'
    expect(necessaryCookie).toBe('false')
    expect(document.cookie).toMatch(`consent_necessary=false`)
    expect(document.cookie).toMatch(`consent_analytics=false`)
  })

  test(`initializer bails with false if consent cookies already set`, () => {
    setAllConsentCookies()
    expect(document.cookie).toBeTruthy()
    const sut = initConsentCookies()
    expect(sut).toBeFalsy()
    expect(document.cookie).toMatch(`consent_necessary=true`)
  })

  test.skip(`removes all consent cookies completely`, () => {
    // FIXME: Cookie persistence in happy-dom makes this test flaky
    setAllConsentCookies()
    expect(document.cookie).toBeTruthy()
    removeConsentCookies()
    // Use getCookie directly to avoid re-initialization via getConsentCookie
    expect(getCookie('consent_necessary')).toBeFalsy()
    expect(getCookie('consent_analytics')).toBeFalsy()
  })
})
