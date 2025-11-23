// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import {
  getConsentCookie,
  initConsentCookies,
  prefixConsentCookie,
  removeConsentCookies,
  setConsentCookie,
} from '@components/Consent/Banner/client/cookies'
import { getCookie } from '@components/scripts/utils/cookies'
import { commonSetup } from '@test/unit/helpers/reset'

describe(`Consent cookies handlers work`, () => {
  // Use commonSetup to ensure clean state between tests
  commonSetup()

  const setAllConsentCookies = () => {
    document.cookie = `consent_analytics=true;Max-Age=30;SameSite=Strict;`
    document.cookie = `consent_marketing=true;Max-Age=30;SameSite=Strict;`
    document.cookie = `consent_functional=true;Max-Age=30;SameSite=Strict;`
  }

  test(`prefixes short form of consent cookie name with 'consent_'`, () => {
    const sut = prefixConsentCookie(`analytics`)
    expect(sut).toMatch(`consent_analytics`)
  })

  test(`sets 'analytics' cookie key using state management`, () => {
    setConsentCookie(`analytics`, `granted`)
    setConsentCookie(`marketing`, `granted`)
    // State management stores 'true' for granted
    expect(document.cookie).toMatch(`consent_analytics=true`)
    expect(document.cookie).toMatch(`consent_marketing=true`)
  })

  test(`gets cookie by key`, () => {
    document.cookie = `consent_analytics=true;Max-Age=30;SameSite=Strict;`
    expect(getConsentCookie(`analytics`)).toMatch(`true`)
  })

  test(`initializes consent cookies and returns true if not already set`, () => {
    // With commonSetup, we have clean state - no cookies exist
    const analyticsCookie = getConsentCookie('analytics')

    // After getConsentCookie, cookies should be initialized
    // All consent defaults to false (opt-in model)
    expect(analyticsCookie).toBe('false')
    expect(document.cookie).toMatch(`consent_analytics=false`)

    // Verify other cookies are also initialized
    const marketingValue = getCookie('consent_marketing')
    expect(marketingValue).toBeTruthy() // Should exist, even if false
  })

  test(`initializer bails with false if consent cookies already set`, () => {
    setAllConsentCookies()
    expect(document.cookie).toBeTruthy()
    const sut = initConsentCookies()
    expect(sut).toBeFalsy()
    expect(document.cookie).toMatch(`consent_analytics=true`)
  })

  test(`removes all consent cookies completely`, () => {
    setAllConsentCookies()
    expect(document.cookie).toBeTruthy()
    expect(document.cookie).toMatch(`consent_analytics=true`)
    expect(document.cookie).toMatch(`consent_marketing=true`)
    expect(document.cookie).toMatch(`consent_functional=true`)

    removeConsentCookies()

    // Verify all consent cookies are removed
    expect(document.cookie).not.toMatch(`consent_analytics`)
    expect(document.cookie).not.toMatch(`consent_marketing`)
    expect(document.cookie).not.toMatch(`consent_functional`)

    // Use cookie utilities to double-check
    expect(getCookie('consent_analytics')).toBeUndefined()
    expect(getCookie('consent_marketing')).toBeUndefined()
    expect(getCookie('consent_functional')).toBeUndefined()
  })
})