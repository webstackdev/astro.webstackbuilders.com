/**
 * Application Bootstrap
 * Initializes state management on every page load
 * This MUST run before any other scripts that depend on state
 */
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import {
  addViewTransitionThemeInitListener,
  initAnimationLifecycle,
  initConsentFromCookies,
  initConsentSideEffects,
  exposeStoreActionsForTesting,
} from '@components/scripts/store'
import { SentryBootstrap } from '@components/scripts/sentry/client'
import {
  getPackageRelease,
  getPrivacyPolicyVersion,
  isProd,
  isDev,
  isE2eTest,
  isTest,
  isUnitTest,
} from '@components/scripts/utils/environmentClient'

export class AppBootstrap {
  static init(): void {
    addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'init' })

    try {
      if (typeof window !== 'undefined' && window.isPlaywrightControlled) {
        window.environmentClientSnapshot = {
          isUnitTest: isUnitTest(),
          isTest: isTest(),
          isE2eTest: isE2eTest(),
          isDev: isDev(),
          isProd: isProd(),
          packageRelease: getPackageRelease(),
          privacyPolicyVersion: getPrivacyPolicyVersion(),
        }
      }

      /* Be careful adding script here. It runs before any script tags in components. */
      if (isProd()) {
        SentryBootstrap.init()
      } else {
        console.info('🔧 Sentry disabled in development mode')
      }

      // 1. Add event listener to set theme on Astro View Transitions API page navigation
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'addViewTransitionThemeInitListener' })
      addViewTransitionThemeInitListener()

      // 2. Initialize animation lifecycle listeners
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initAnimationLifecycle' })
      initAnimationLifecycle()

      // 3. Initialize consent from cookies
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initConsentFromCookies' })
      initConsentFromCookies()

      // 4. Setup all module-specific side effects (runs once per page load)
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initConsentSideEffects' })
      initConsentSideEffects()

      // 5. Expose limited store actions for Playwright-driven E2E tests
      exposeStoreActionsForTesting()
    } catch (error: unknown) {
      const scriptError = new ClientScriptError(error)
      throw scriptError
    }
  }
}
