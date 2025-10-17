/*eslint camelcase: ["error", {properties: "never"}]*/
/**
 * State management for cookie consent
 */
import { getCookie, setCookie, removeCookie } from "@components/Scripts/state"

type Preference = `granted` | `refused` | `unknown`

interface Consent {
  necessary: Preference
  analytics: Preference
  advertising: Preference
  functional: Preference
}

type Categories = keyof Consent

export const consentCookies: Categories[] = [
  `necessary`,
  `analytics`,
  `advertising`,
  `functional`,
]

export const prefixConsentCookie = (name: string) => {
  return `consent_${name}`
}

export const getConsentCookie = (name: Categories) => {
  const necessary = getCookie(`consent_necessary`)
  if (!necessary) initConsentCookies()
  return getCookie(prefixConsentCookie(name))
}

export const setConsentCookie = (name: Categories, preference: Preference = `granted`) => {
  setCookie(prefixConsentCookie(name), preference)
}

/**
 * @returns false if the user has already consented to cookies, true otherwise
 */
export const initConsentCookies = () => {
  const necessary = getCookie(`consent_necessary`)
  if (necessary && `unknown` !== necessary) return false
  /** Show modal if user has not made choice but cookies already initialized */
  if (`unknown` === necessary) return true
  consentCookies.forEach(name => setCookie(prefixConsentCookie(name), `unknown`))
  return true
}

export const allowAllConsentCookies = () => {
  consentCookies.forEach(name => setCookie(prefixConsentCookie(name), `granted`))
}

export const removeConsentCookies = () => {
  consentCookies.forEach(name => removeCookie(prefixConsentCookie(name)))
}
