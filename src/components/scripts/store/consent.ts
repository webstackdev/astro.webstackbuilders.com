/**
 * Cookie Consent State Management
 */
import { computed, onMount } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'
import { StoreController } from '@nanostores/lit'
import type { ReactiveControllerHost } from 'lit'
import { getCookie, removeCookie, setCookie } from '@components/scripts/utils/cookies'
import { handleScriptError } from '@components/scripts/errors/handler'
import { $isConsentBannerVisible } from '@components/scripts/store/visibility'
import { getOrCreateDataSubjectId, deleteDataSubjectId } from '@components/scripts/utils/dataSubjectId'

// ============================================================================
// TYPES
// ============================================================================

export type ConsentCategory = 'analytics' | 'marketing' | 'functional'
export type ConsentCategories = ConsentCategory
export type ConsentValue = boolean
export type ConsentPreference = 'granted' | 'refused' | 'unknown'

export interface ConsentState {
  analytics: ConsentValue
  marketing: ConsentValue
  functional: ConsentValue
  DataSubjectId: string
}

const consentCookieCategories: ConsentCategories[] = ['analytics', 'marketing', 'functional']
const CONSENT_COOKIE_PREFIX = 'consent_'

const prefixConsentCookie = (category: ConsentCategories): string => `${CONSENT_COOKIE_PREFIX}${category}`

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
// @TODO: $consent.get() - should subscribe instead
export const $consent = persistentAtom<ConsentState>('cookieConsent', {
  analytics: false,
  marketing: false,
  functional: false,
  DataSubjectId: '', // Will be set on first access
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
        DataSubjectId: '',
      }
    }
  },
})

// Initialize DataSubjectId on store mount
onMount($consent, () => {
  const currentState = $consent.get()
  if (!currentState.DataSubjectId) {
    $consent.set({
      ...currentState,
      DataSubjectId: getOrCreateDataSubjectId(),
    })
  }
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
// COOKIE HELPERS
// ============================================================================

/**
 * Read a consent cookie value, ensuring defaults exist before access
 */
export function getConsentCookie(category: ConsentCategories): string | undefined {
  const analyticsCookie = getCookie(prefixConsentCookie('analytics'))
  if (typeof analyticsCookie === 'undefined') {
    initConsentCookies()
  }

  return getCookie(prefixConsentCookie(category))
}

/**
 * Persist consent through the centralized state updates
 */
export function setConsentCookie(
  category: ConsentCategories,
  preference: ConsentPreference = 'granted',
): void {
  const granted = preference === 'granted'
  updateConsent(category, granted)
}

/**
 * Initialize consent cookies with opt-out defaults
 */
export function initConsentCookies(): boolean {
  return ensureConsentCookiesInitialized()
}

/**
 * Grant all consent categories (used by consent banner primary CTA)
 */
export function allowAllConsentCookies(): void {
  allowAllConsent()
}

/**
 * Remove persisted consent cookies without mutating store state
 */
export function removeConsentCookies(): void {
  consentCookieCategories.forEach((category) => {
    removeCookie(prefixConsentCookie(category))
  })
}

// ============================================================================
// SUBSCRIPTION HELPERS
// ============================================================================

export type ConsentSubscription = (_hasConsent: boolean) => void

/**
 * Read the current functional consent preference
 */
export function getFunctionalConsentPreference(): boolean {
  return $hasFunctionalConsent.get()
}

export function getAnalyticsConsentPreference(): boolean {
  return $hasAnalyticsConsent.get()
}

/**
 * Subscribe to functional consent changes with immediate synchronization
 */
export function subscribeToFunctionalConsent(listener: ConsentSubscription): () => void {
  const unsubscribe = $hasFunctionalConsent.listen(listener)
  listener($hasFunctionalConsent.get())
  return unsubscribe
}

// ============================================================================
// ACTIONS
// ============================================================================

export type ConsentStateListener = (_consent: ConsentState) => void

export function getConsentSnapshot(): ConsentState {
  return $consent.get()
}

export function subscribeToConsentState(listener: ConsentStateListener): () => void {
  return $consent.listen(listener)
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

/**
 * Ensure consent cookies exist with explicit opt-out defaults
 * Returns true when cookies were initialized during this call
 */
export function ensureConsentCookiesInitialized(): boolean {
  const analyticsCookie = getCookie('consent_analytics')

  if (typeof analyticsCookie === 'undefined') {
    updateConsent('analytics', false)
    updateConsent('marketing', false)
    updateConsent('functional', false)
    return true
  }

  return false
}

// ============================================================================
// SIDE EFFECTS
// ============================================================================

/**
 * Initialize consent state from cookies on page load
 * Called once during app initialization from bootstrap
 */
export function initConsentFromCookies(): void {
  try {
    const currentState = $consent.get()
    const consent: ConsentState = {
      analytics: getCookie('consent_analytics') === 'true',
      marketing: getCookie('consent_marketing') === 'true',
      functional: getCookie('consent_functional') === 'true',
      DataSubjectId: currentState.DataSubjectId || getOrCreateDataSubjectId(),
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
      DataSubjectId: getOrCreateDataSubjectId(),
    })
  }
}

export function initConsentSideEffects(): void {
  // Side Effect 1: Show/hide cookie modal
  $isConsentBannerVisible.subscribe((visible) => {
    try {
      const modal = document.getElementById('consent-modal-id')
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

  // Side Effect 2: Log consent changes to API
  $consent.subscribe(async (consentState, oldConsentState) => {
    try {
      // Only log if purposes changed (not on initial load)
      if (!oldConsentState) return

      // Check if any consent category actually changed
      const categoriesChanged = ['analytics', 'marketing', 'functional'].some(
        (category) => consentState[category as ConsentCategory] !== oldConsentState[category as ConsentCategory]
      )

      if (!categoriesChanged) return

      // Collect granted purposes
      const purposes: string[] = []
      if (consentState.analytics) purposes.push('analytics')
      if (consentState.marketing) purposes.push('marketing')
      if (consentState.functional) purposes.push('functional')

      await fetch('/api/gdpr/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          DataSubjectId: consentState.DataSubjectId,
          purposes,
          source: 'cookies_modal',
          userAgent: navigator.userAgent,
          verified: false,
        }),
      })
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'cookieConsent',
        operation: 'logConsentToAPI',
      })
    }
  })

  // Side Effect 3: Delete DataSubjectId when functional consent is revoked
  $hasFunctionalConsent.subscribe((hasConsent) => {
    if (!hasConsent) {
      try {
        deleteDataSubjectId()
      } catch (error) {
        handleScriptError(error, {
          scriptName: 'cookieConsent',
          operation: 'deleteDataSubjectId',
        })
      }
    }
  })

  // Side Effect 4: Update Sentry context when analytics consent changes
  $hasAnalyticsConsent.subscribe((hasConsent) => {
    try {
      // Dynamically import to avoid circular dependencies and allow lazy loading
      import('@components/scripts/sentry/helpers').then(({ updateConsentContext }) => {
        updateConsentContext(hasConsent)
      }).catch((error) => {
        // Sentry may not be initialized in all environments
        console.warn('Failed to update Sentry consent context:', error)
      })
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'cookieConsent',
        operation: 'updateSentryConsent',
      })
    }
  })
}

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * Create a reactive StoreController for $consent
 * For use in Lit components - automatically triggers re-render when consent state changes
 */
export function createConsentController(host: ReactiveControllerHost): StoreController<ConsentState> {
  return new StoreController(host, $consent)
}

/**
 * Create a reactive StoreController for $hasAnalyticsConsent
 * For use in Lit components - automatically triggers re-render when analytics consent changes
 */
export function createAnalyticsConsentController(host: ReactiveControllerHost): StoreController<boolean> {
  return new StoreController(host, $hasAnalyticsConsent)
}

/**
 * Create a reactive StoreController for $hasFunctionalConsent
 * For use in Lit components - automatically triggers re-render when functional consent changes
 */
export function createFunctionalConsentController(host: ReactiveControllerHost): StoreController<boolean> {
  return new StoreController(host, $hasFunctionalConsent)
}

/**
 * Create a reactive StoreController for $hasMarketingConsent
 * For use in Lit components - automatically triggers re-render when marketing consent changes
 */
export function createMarketingConsentController(host: ReactiveControllerHost): StoreController<boolean> {
  return new StoreController(host, $hasMarketingConsent)
}

/**
 * Create a reactive StoreController for $hasAnyConsent
 * For use in Lit components - automatically triggers re-render when any consent changes
 */
export function createAnyConsentController(host: ReactiveControllerHost): StoreController<boolean> {
  return new StoreController(host, $hasAnyConsent)
}
