/**
 * Cookie Consent State Management
 */
import { map, computed, atom } from 'nanostores'
import type { ConsentState, ConsentCategory, ConsentValue } from './@types'
import { getCookie, setCookie } from '../cookies'
import { handleScriptError } from '@components/Scripts/errors'

// ============================================================================
// STORES
// ============================================================================

/**
 * Consent preferences
 * Source of truth: Cookies (necessary for GDPR compliance)
 * Store updates when cookies change
 */
export const $consent = map<ConsentState>({
  necessary: true,
  analytics: false,
  advertising: false,
  functional: false,
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
    // Update store
    $consent.setKey(category, value)

    // Update cookie
    const cookieName = `consent_${category}`
    setCookie(cookieName, value.toString(), { expires: 365, sameSite: 'strict' })

    // Add timestamp
    $consent.setKey('timestamp', new Date().toISOString())
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

// ============================================================================
// SIDE EFFECTS
// ============================================================================

/**
 * Setup consent-related side effects
 */
export function initConsentSideEffects(): void {
  // Side Effect 1: Show/hide cookie modal
  $cookieModalVisible.subscribe((visible) => {
    try {
      const modal = document.getElementById('cookie-modal-id')
      if (modal) {
        modal.style.display = visible ? 'flex' : 'none'
      }
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'cookieConsent',
        operation: 'modalVisibility',
      })
    }
  })

  // Side Effect 2: Reload consent-gated scripts when consent changes
  $hasAnalyticsConsent.subscribe((hasConsent) => {
    try {
      window.dispatchEvent(
        new CustomEvent('consent-changed', {
          detail: { category: 'analytics', granted: hasConsent },
        })
      )
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'cookieConsent',
        operation: 'analyticsConsentEvent',
      })
    }
  })

  // Side Effect 3: Handle functional consent changes for scripts
  $hasFunctionalConsent.subscribe((hasConsent) => {
    try {
      window.dispatchEvent(
        new CustomEvent('consent-changed', {
          detail: { category: 'functional', granted: hasConsent },
        })
      )
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'cookieConsent',
        operation: 'functionalConsentEvent',
      })
    }
  })

  // Side Effect 4: Handle advertising consent changes for scripts
  $hasAdvertisingConsent.subscribe((hasConsent) => {
    try {
      window.dispatchEvent(
        new CustomEvent('consent-changed', {
          detail: { category: 'advertising', granted: hasConsent },
        })
      )
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'cookieConsent',
        operation: 'advertisingConsentEvent',
      })
    }
  })
}
