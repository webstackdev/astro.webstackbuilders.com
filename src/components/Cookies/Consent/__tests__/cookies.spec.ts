import { beforeEach, describe, expect, test } from 'vitest'
import { AppBootstrap } from '@components/Scripts/state/bootstrap'
import {
  getConsentCookie,
  initConsentCookies,
  prefixConsentCookie,
  removeConsentCookies,
  setConsentCookie,
} from '../cookies'

describe(`Consent cookies handlers work`, () => {
  beforeEach(() => {
    // Initialize state management before each test
    AppBootstrap.init()
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

  test(`initializes consent cookies and returns true if not already set`, () => {
    // Clear all existing cookies first
    removeConsentCookies()
    const sut = initConsentCookies()
    expect(sut).toBeTruthy()
    // State management stores 'false' for not granted
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

  test(`removes all consent cookies completely`, () => {
    setAllConsentCookies()
    expect(document.cookie).toBeTruthy()
    removeConsentCookies()
    // Cookies are completely removed for test cleanup
    expect(document.cookie).toBe('')
  })
})
