/**
 * Application Bootstrap
 * Initializes state management on every page load
 * This MUST run before any other scripts that depend on state
 */
import { ClientScriptError } from '@components/Scripts/errors/ClientScriptError'
import { addScriptBreadcrumb } from '@components/Scripts/errors'
import { initConsentFromCookies, initStateSideEffects } from '@components/Scripts/state'

declare global {
  interface Window {
    _bootstrapError?: ClientScriptError
    _isBootstrapped: boolean
  }
}

export class AppBootstrap {
  static init(): void {
    addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'init' })

    let hasError = false

    try {
      // 1. Load consent from cookies into store
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initConsentFromCookies' })
      initConsentFromCookies()
    } catch (error: unknown) {
      hasError = true
      const scriptError = new ClientScriptError(error)
      if (import.meta.env.PROD) {
        throw scriptError
      } else {
        window._isBootstrapped = true
        window._bootstrapError = scriptError
        console.error('❌ [12374] Failed to initialize consent from cookies:', scriptError)
      }
    }

    try {
      // 2. Setup side effects (runs once per page load)
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initStateSideEffects' })
      initStateSideEffects()
    } catch (error: unknown) {
      hasError = true
      const scriptError = new ClientScriptError(error)
      if (import.meta.env.PROD) {
        throw scriptError
      } else {
        window._isBootstrapped = true
        window._bootstrapError = scriptError
        console.error('❌ [38088] Failed to initialize state side effects', scriptError)
      }
    }

    if (!import.meta.env.PROD && !hasError) {
      window._isBootstrapped = true
      console.info('✅ [36853] App state initialized')
    }
  }
}