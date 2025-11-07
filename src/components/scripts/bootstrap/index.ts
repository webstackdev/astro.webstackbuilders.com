/**
 * Application Bootstrap
 * Initializes state management on every page load
 * This MUST run before any other scripts that depend on state
 */
import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { initConsentFromCookies } from '@components/scripts/store'
import { initConsentSideEffects, initStateSideEffects } from '@components/scripts/bootstrap/consent'
import { initThemeSystem } from '@components/scripts/store/themes'
import { SentryBootstrap } from '@components/scripts/sentry/client'
import { PUBLIC_SENTRY_DSN } from 'astro:env/client'

export class AppBootstrap {
  static init(): void {
    addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'init' })

    try {
      /* Be careful adding script here. It runs before any script tags in components. */
      if (import.meta.env.PROD && PUBLIC_SENTRY_DSN) {
        SentryBootstrap.init()
      } else {
        console.info('🔧 Sentry disabled in development mode')
      }

      // 1. Initialize consent from cookies first
      // This must happen before side effects because side effects may depend on consent state
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initConsentFromCookies' })
      initConsentFromCookies()

      // 2. Setup all module-specific side effects (runs once per page load)
      // Note: persistentAtom stores auto-load from localStorage on import
      // But we need to sync cookies -> localStorage for consent
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initConsentSideEffects' })
      initConsentSideEffects()

      // 3. Initialize theme system (replaces old setInitialTheme + initThemeSideEffects)
      // This synchronizes DOM, localStorage, and store state
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initThemeSystem' })
      initThemeSystem()

      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initStateSideEffects' })
      initStateSideEffects()
    } catch (error: unknown) {
      const scriptError = new ClientScriptError(error)
      throw scriptError
    }
  }
}
