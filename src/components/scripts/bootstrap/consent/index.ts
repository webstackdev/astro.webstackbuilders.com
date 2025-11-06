// @TODO: Moved from components/scripts/store/cookieConsent.ts
import { handleScriptError } from '@components/scripts/errors'
import {
  $isConsentBannerVisible,
  $hasAdvertisingConsent,
  $hasAnalyticsConsent,
  $hasFunctionalConsent,
} from '@components/scripts/store'
import { clearEmbedCache } from '@components/scripts/store/socialEmbeds'

// ============================================================================
// SIDE EFFECTS
// ============================================================================

/**
 * Setup consent-related side effects
 */
export function initConsentSideEffects(): void {
  // Side Effect 1: Show/hide cookie modal
  $isConsentBannerVisible.subscribe((visible) => {
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

/**
 * Setup side effects - call once during app initialization
 * This is like Redux middleware or RTK's createAsyncThunk
 */
// #TODO: Moved from components/scripts/bootstrap
export function initStateSideEffects(): void {
  // Side Effect: Clear localStorage when functional consent is revoked
  $hasFunctionalConsent.subscribe((hasConsent) => {
    if (!hasConsent) {
      try {
        // Clear theme from localStorage
        localStorage.removeItem('theme')

        // Clear Mastodon instances from localStorage
        localStorage.removeItem('mastodonInstances')
        localStorage.removeItem('mastodonCurrentInstance')

        // Clear embed cache
        clearEmbedCache()
      } catch (error) {
        handleScriptError(error, {
          scriptName: 'AppBootstrap',
          operation: 'clearLocalStorageOnConsentRevoke',
        })
      }
    }
  })
}
