/**
 * Application Bootstrap
 * Initializes state management on every page load
 * This MUST run before any other scripts that depend on state
 */
import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'
import { addScriptBreadcrumb, handleScriptError } from '@components/scripts/errors'
import { $hasFunctionalConsent, initConsentFromCookies } from '@components/scripts/store'
import { initConsentSideEffects } from '@components/scripts/store/cookieConsent'
import { initThemeSideEffects } from '@components/scripts/store/themes'
import { clearEmbedCache } from '@components/scripts/store/socialEmbeds'

/**
 * Setup side effects - call once during app initialization
 * This is like Redux middleware or RTK's createAsyncThunk
 */
function initStateSideEffects(): void {
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
          scriptName: 'AppBootstrap',
          operation: 'clearLocalStorageOnConsentRevoke',
        })
      }
    }
  })
}

export class AppBootstrap {
  static init(): void {
    addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'init' })

    try {
      // 1. Initialize consent from cookies first
      // This must happen before side effects because side effects may depend on consent state
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initConsentFromCookies' })
      initConsentFromCookies()

      // 2. Setup side effects (runs once per page load)
      // Note: persistentAtom stores auto-load from localStorage on import
      // But we need to sync cookies -> localStorage for consent
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initStateSideEffects' })
      initStateSideEffects()
    } catch (error: unknown) {
      const scriptError = new ClientScriptError(error)
      throw scriptError
    }
  }
}
