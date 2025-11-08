/**
 * Cookie Consent State Management
 */
import { computed } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'
import { getCookie, setCookie } from '@components/scripts/utils/cookies'
import { handleScriptError } from '@components/scripts/errors'

// ============================================================================
// TYPES
// ============================================================================

export type ConsentCategory = 'analytics' | 'marketing' | 'functional'
export type ConsentCategories = ConsentCategory
export type ConsentValue = boolean

export interface ConsentState {
  analytics: ConsentValue
  marketing: ConsentValue
  functional: ConsentValue
}

// ============================================================================
// STORES
// ============================================================================

/**
 * Consent preferences
 * Persisted to localStorage automatically via nanostores/persistent
 * Also synced with cookies for GDPR compliance
 *
 * Note: 'functional' defaults to false (opt-in model) as it stores personal data
 * (Mastodon instance preferences which can identify users). Theme and social cache
 * are classified as 'necessary' and handled separately without requiring consent.
 */
export const $consent = persistentAtom<ConsentState>('cookieConsent', {
  analytics: false,
  marketing: false,
  functional: false,
}, {
  encode: JSON.stringify,
  decode: (value: string): ConsentState => {
    try {
      return JSON.parse(value)
    } catch {
      return {
        analytics: false,
        marketing: false,
        functional: false,
      }
    }
  },
})

// ============================================================================
// COMPUTED STORES
// ============================================================================

/**
 * Check if specific consent category is granted
 */
export const $hasAnalyticsConsent = computed($consent, (consent) => consent.analytics)
export const $hasFunctionalConsent = computed($consent, (consent) => consent.functional)
export const $hasMarketingConsent = computed($consent, (consent) => consent.marketing)

/**
 * Check if any consent is granted
 */
export const $hasAnyConsent = computed($consent, (consent) => {
  return consent.analytics || consent.functional || consent.marketing
})

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Initialize consent state from cookies on page load
 * Called once during app initialization from bootstrap
 */
export function initConsentFromCookies(): void {
  try {
    const consent: ConsentState = {
      analytics: getCookie('consent_analytics') === 'true',
      marketing: getCookie('consent_marketing') === 'true',
      functional: getCookie('consent_functional') === 'true',
    }

    $consent.set(consent)
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'cookieConsent',
      operation: 'initConsentFromCookies',
    })
    // Set safe defaults if cookie reading fails
    $consent.set({
      analytics: false,
      marketing: false,
      functional: false,
    })
  }
}

/**
 * Update consent for specific category
 * Automatically updates both store AND cookie
 */
export function updateConsent(category: ConsentCategory, value: ConsentValue): void {
  try {
    // Get current state
    const currentConsent = $consent.get()

    // Update store with new value
    $consent.set({
      ...currentConsent,
      [category]: value,
    })

    // Update cookie
    const cookieName = `consent_${category}`
    setCookie(cookieName, value.toString(), { expires: 365, sameSite: 'strict' })
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'cookieConsent',
      operation: 'updateConsent',
    })
  }
}

/**
 * Grant all consent categories
 */
export function allowAllConsent(): void {
  const categories: ConsentCategory[] = ['analytics', 'marketing', 'functional']
  categories.forEach((category) => updateConsent(category, true))
}

/**
 * Revoke all consent
 */
export function revokeAllConsent(): void {
  updateConsent('analytics', false)
  updateConsent('marketing', false)
  updateConsent('functional', false)
}
