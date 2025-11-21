/*eslint camelcase: ["error", {properties: "never"}]*/
/**
 * State management for cookie consent
 * Now uses centralized state store from lib/state
 */
import { getCookie, removeCookie } from '@components/scripts/utils/cookies'
import { updateConsent, type ConsentCategories } from '@components/scripts/store'

type Preference = `granted` | `refused` | `unknown`

export const consentCookies: ConsentCategories[] = [`analytics`, `marketing`, `functional`]

export const prefixConsentCookie = (name: string) => {
  return `consent_${name}`
}

export const getConsentCookie = (name: ConsentCategories) => {
  const analytics = getCookie(`consent_analytics`)
  if (!analytics) initConsentCookies()
  return getCookie(prefixConsentCookie(name))
}

/**
 * Set consent cookie using centralized state management
 * This updates both the store and the cookie automatically
 */
export const setConsentCookie = (name: ConsentCategories, preference: Preference = `granted`) => {
  const granted = preference === 'granted'
  updateConsent(name as 'analytics' | 'marketing' | 'functional', granted)
}

/**
 * @returns false if the user has already consented to cookies, true otherwise
 */
export const initConsentCookies = () => {
  const analytics = getCookie(`consent_analytics`)
  // If cookie doesn't exist, initialize consent values
  if (!analytics) {
    // Set tracking consent to false (user hasn't opted in yet)
    updateConsent('analytics', false)
    updateConsent('marketing', false)
    // Functional consent defaults to false (opt-in for Mastodon instance storage)
    updateConsent('functional', false)
    return true
  }
  // If analytics cookie is 'true', user has already made a choice, return false
  if (analytics === 'true') return false
  // Otherwise, cookies exist but are false (user declined), return false
  return false
}

export const allowAllConsentCookies = () => {
  // Grant all consent using state management
  consentCookies.forEach(name => {
    updateConsent(name as 'analytics' | 'marketing' | 'functional', true)
  })
}

export const removeConsentCookies = () => {
  consentCookies.forEach(name => {
    const cookieName = prefixConsentCookie(name)
    removeCookie(cookieName)
  })
}
