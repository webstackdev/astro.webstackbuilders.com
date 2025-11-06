/**
 * Cookie Consent State Management
 */
import { computed, atom } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'
import type { ConsentState, ConsentCategory, ConsentValue } from './@types'
import { getCookie, setCookie } from '@components/scripts/utils/cookies'
import { handleScriptError } from '@components/scripts/errors'

// ============================================================================
// TYPES
// ============================================================================

export type ConsentCategory = 'necessary' | 'analytics' | 'advertising' | 'functional'
export type ConsentValue = boolean

export interface ConsentState {
  necessary: ConsentValue
  analytics: ConsentValue
  advertising: ConsentValue
  functional: ConsentValue
  timestamp?: string
}

// ============================================================================
// STORES
// ============================================================================

/**
 * Consent preferences
 * Persisted to localStorage automatically via nanostores/persistent
 * Also synced with cookies for GDPR compliance
 *
 * Note: 'functional' defaults to true as it covers strictly necessary storage
 * for site functionality (theme, UI state, error logging without PII, etc.)
 * Users can opt-out via cookie preferences if desired.
 */
export const $consent = persistentAtom<ConsentState>('cookieConsent', {
  necessary: true,
  analytics: false,
  advertising: false,
  functional: true,
}, {
  encode: JSON.stringify,
  decode: (value: string): ConsentState => {
    try {
      return JSON.parse(value)
    } catch {
      return {
        necessary: true,
        analytics: false,
        advertising: false,
        functional: true,
      }
    }
  },
})

/**
 * Cookie consent modal visibility
 * Session-only state (not persisted)
 */
export const $cookieModalVisible = atom<boolean>(false)

// ============================================================================
// COMPUTED STORES
// ============================================================================

/**
 * Check if specific consent category is granted
 */
export const $hasAnalyticsConsent = computed($consent, (consent) => consent.analytics)
export const $hasFunctionalConsent = computed($consent, (consent) => consent.functional)
export const $hasAdvertisingConsent = computed($consent, (consent) => consent.advertising)

/**
 * Check if any non-necessary consent is granted
 */
export const $hasAnyConsent = computed($consent, (consent) => {
  return consent.analytics || consent.functional || consent.advertising
})

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Initialize consent state from cookies on page load
 * Called once during app initialization
 */
export function initConsentFromCookies(): void {
  try {
    const consent: ConsentState = {
      necessary: true, // Always true
      analytics: getCookie('consent_analytics') === 'true',
      advertising: getCookie('consent_advertising') === 'true',
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
      necessary: true,
      analytics: false,
      advertising: false,
      functional: true,
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
      timestamp: new Date().toISOString(),
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
  const categories: ConsentCategory[] = ['necessary', 'analytics', 'advertising', 'functional']
  categories.forEach((category) => updateConsent(category, true))
}

/**
 * Revoke all non-necessary consent
 */
export function revokeAllConsent(): void {
  updateConsent('analytics', false)
  updateConsent('advertising', false)
  updateConsent('functional', false)
}
