/*eslint camelcase: ["error", {properties: "never"}]*/
/**
 * State management for cookie consent
 * Now uses centralized state store from lib/state
 */
import { getCookie, removeCookie } from '@components/scripts/utils/cookies'
import { updateConsent } from '@components/scripts/store'

type Preference = `granted` | `refused` | `unknown`

interface Consent {
  necessary: Preference
  analytics: Preference
  marketing: Preference
  functional: Preference
}

type Categories = keyof Consent

export const consentCookies: Categories[] = [`necessary`, `analytics`, `marketing`, `functional`]

export const prefixConsentCookie = (name: string) => {
  return `consent_${name}`
}

export const getConsentCookie = (name: Categories) => {
  const necessary = getCookie(`consent_necessary`)
  if (!necessary) initConsentCookies()
  return getCookie(prefixConsentCookie(name))
}

/**
 * Set consent cookie using centralized state management
 * This updates both the store and the cookie automatically
 */
export const setConsentCookie = (name: Categories, preference: Preference = `granted`) => {
  const granted = preference === 'granted'
  updateConsent(name as 'necessary' | 'analytics' | 'marketing' | 'functional', granted)
}

/**
 * @returns false if the user has already consented to cookies, true otherwise
 */
export const initConsentCookies = () => {
  const necessary = getCookie(`consent_necessary`)
  // If cookie doesn't exist, initialize consent values
  if (!necessary) {
    // Set tracking consent to false (user hasn't opted in yet)
    updateConsent('analytics', false)
    updateConsent('marketing', false)
    // Functional consent defaults to false (opt-in for Mastodon instance storage)
    updateConsent('functional', false)
    updateConsent('necessary', true)
    return true
  }
  // If necessary cookie is 'true', user has already made a choice, return false
  if (necessary === 'true') return false
  // Otherwise, cookies exist but are false (user declined), return false
  return false
}

export const allowAllConsentCookies = () => {
  // Grant all consent using state management
  consentCookies.forEach(name => {
    updateConsent(name as 'necessary' | 'analytics' | 'marketing' | 'functional', true)
  })
}

export const removeConsentCookies = () => {
  consentCookies.forEach(name => {
    const cookieName = prefixConsentCookie(name)
    removeCookie(cookieName)
  })
}
