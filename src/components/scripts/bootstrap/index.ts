/**
 * Application Bootstrap
 * Initializes state management on every page load
 * This MUST run before any other scripts that depend on state
 */
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import {
  initAnimationLifecycle,
  initConsentFromCookies,
  initConsentSideEffects,
  initHeaderSearchSideEffects,
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

      // 1. Initialize animation lifecycle listeners
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initAnimationLifecycle' })
      initAnimationLifecycle()

      // 2. Initialize consent from cookies
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initConsentFromCookies' })
      initConsentFromCookies()

      // 3. Setup all module-specific side effects (runs once per page load)
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initConsentSideEffects' })
      initConsentSideEffects()

      // 3b. Setup header search UI side effects
      addScriptBreadcrumb({ scriptName: 'AppBootstrap', operation: 'initHeaderSearchSideEffects' })
      initHeaderSearchSideEffects()

      // 4. Expose limited store actions for Playwright-driven E2E tests
      exposeStoreActionsForTesting()

      console.info('🏁 Bootstrap completed')
    } catch (error: unknown) {
      const scriptError = new ClientScriptError(error)
      console.info('⛔ Bootstrap errored:', scriptError)
      throw scriptError
    }
  }
}
