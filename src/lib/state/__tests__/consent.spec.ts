import { describe, expect, test } from "vitest"
import {
  getConsentCookie,
  initConsentCookies,
  prefixConsentCookie,
  removeConsentCookies,
  setConsentCookie,
} from "../cookies/consent"

describe(`Consent cookies handlers work`, () => {
  const setAllConsentCookies = () => {
    document.cookie = `consent_necessary=granted;Max-Age=30;SameSite=Strict;`
    document.cookie = `consent_analytics=granted;Max-Age=30;SameSite=Strict;`
    document.cookie = `consent_advertising=granted;Max-Age=30;SameSite=Strict;`
    document.cookie = `consent_functional=granted;Max-Age=30;SameSite=Strict;`
  }

  test(`prefixes short form of consent cookie name with 'consent_'`, () => {
    const sut = prefixConsentCookie(`necessary`)
    expect(sut).toMatch(`consent_necessary`)
  })

  test(`sets 'necessary' cookie key using default`, () => {
    setConsentCookie(`necessary`, `granted`)
    setConsentCookie(`analytics`, `granted`)
    expect(document.cookie).toMatch(`consent_necessary=granted; consent_analytics=granted`)
  })

  test(`gets cookie by key`, () => {
    document.cookie = `consent_necessary=granted;Max-Age=30;SameSite=Strict;`
    expect(getConsentCookie(`necessary`)).toMatch(`granted`)
  })

  test(`initializes consent cookies and returns true if not already set`, () => {
    const sut = initConsentCookies()
    expect(sut).toBeTruthy()
    expect(document.cookie).toMatch(
      `consent_necessary=unknown; consent_analytics=unknown; consent_advertising=unknown; consent_functional=unknown`
    )
  })

  test(`initializer bails with false if consent cookies already set`, () => {
    setAllConsentCookies()
    expect(document.cookie).toBeTruthy()
    const sut = initConsentCookies()
    expect(sut).toBeFalsy()
    expect(document.cookie).toMatch(
      `consent_necessary=granted; consent_analytics=granted; consent_advertising=granted; consent_functional=granted`
    )
  })

  test(`removes all consent cookies`, () => {
    setAllConsentCookies()
    expect(document.cookie).toBeTruthy()
    removeConsentCookies()
    expect(document.cookie).toBeFalsy()
  })
})
