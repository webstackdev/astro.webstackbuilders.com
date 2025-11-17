/**
 * Application Bootstrap
 * Initializes state management on every page load
 * This MUST run before any other scripts that depend on state
 */
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import {
  addViewTransitionThemeInitListener,
  initConsentFromCookies,
  initConsentSideEffects,
} from '@components/scripts/store'
import { SentryBootstrap } from '@components/scripts/sentry/client'
import { isProd } from '@components/scripts/utils'

export class AppBootstrap {
  static init(): void {
    addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'init' })

    try {
      /* Be careful adding script here. It runs before any script tags in components. */
      if (isProd()) {
        SentryBootstrap.init()
      } else {
        console.info('🔧 Sentry disabled in development mode')
      }

      // 1. Add event listener to set theme on Astro View Transitions API page navigation
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'addViewTransitionThemeInitListener' })
      addViewTransitionThemeInitListener()

      // 2. Initialize consent from cookies
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initConsentFromCookies' })
      initConsentFromCookies()

      // 2. Setup all module-specific side effects (runs once per page load)
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initConsentSideEffects' })
      initConsentSideEffects()
    } catch (error: unknown) {
      const scriptError = new ClientScriptError(error)
      throw scriptError
    }
  }
}
