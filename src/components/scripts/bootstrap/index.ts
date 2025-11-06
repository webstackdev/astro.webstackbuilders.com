/**
 * Application Bootstrap
 * Initializes state management on every page load
 * This MUST run before any other scripts that depend on state
 */
import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { initConsentFromCookies } from '@components/scripts/store'
import { initConsentSideEffects, initStateSideEffects } from '@components/scripts/consent'
import { initThemeSideEffects, setInitialTheme } from '@components/scripts/theme'
import { SentryBootstrap } from '@components/scripts/sentry/client'
import { PUBLIC_SENTRY_DSN } from 'astro:env/client'

export class AppBootstrap {
  static init(): void {
    addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'init' })

    try {
      /** Script to set theme name on <html>. This should be inlined by Astro so */
      /** that it runs first. Do not add other scripts in this <script> block. */
      setInitialTheme()

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

      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initThemeSideEffects' })
      initThemeSideEffects()

      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initStateSideEffects' })
      initStateSideEffects()
    } catch (error: unknown) {
      const scriptError = new ClientScriptError(error)
      throw scriptError
    }
  }
}
