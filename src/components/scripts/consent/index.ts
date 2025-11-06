// @TODO: Moved from components/scripts/store/cookieConsent.ts
import { handleScriptError } from '@components/scripts/errors'
import {
  $cookieModalVisible,
  $hasAdvertisingConsent,
  $hasAnalyticsConsent,
  $hasFunctionalConsent,
} from '@components/scripts/store/cookieConsent'
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
