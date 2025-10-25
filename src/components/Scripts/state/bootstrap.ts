/**
 * Application Bootstrap
 * Initializes state management on every page load
 * This MUST run before any other scripts that depend on state
 */
import { ClientScriptError } from '@components/Scripts/errors/ClientScriptError'
import { addScriptBreadcrumb } from '@components/Scripts/errors'
import { initConsentFromCookies, initStateSideEffects } from '@components/Scripts/state'

export class AppBootstrap {
  static init(): void {
    addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'init' })

    try {
      // 1. Load consent from cookies into store
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initConsentFromCookies' })
      initConsentFromCookies()
    } catch (error: unknown) {
      const scriptError = new ClientScriptError(error)
      throw scriptError
    }

    try {
      // 2. Setup side effects (runs once per page load)
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initStateSideEffects' })
      initStateSideEffects()
    } catch (error: unknown) {
      const scriptError = new ClientScriptError(error)
      throw scriptError
    }
  }
}
