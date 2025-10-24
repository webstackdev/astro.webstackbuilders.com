/**
 * State Management Utilities
 * General utilities and side effects initialization
 */
import { $hasFunctionalConsent, initConsentSideEffects } from './cookieConsent'
import { initThemeSideEffects } from './themes'
import { clearEmbedCache } from './socialEmbeds'
import { handleScriptError } from '@components/Scripts/errors'

/**
 * Setup side effects - call once during app initialization
 * This is like Redux middleware or RTK's createAsyncThunk
 */
export function initStateSideEffects(): void {
  // Initialize all module-specific side effects
  initConsentSideEffects()
  initThemeSideEffects()

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
          scriptName: 'utils',
          operation: 'clearLocalStorageOnConsentRevoke',
        })
      }
    }
  })
}
