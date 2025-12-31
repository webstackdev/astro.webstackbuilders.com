/**
 * This file cannot be used in API endpoint code. See
 * src/lib/config/environmentServer.ts for details.
 */
import {
  PACKAGE_RELEASE_VERSION,
  PRIVACY_POLICY_VERSION,
  PUBLIC_GOOGLE_MAPS_API_KEY,
  PUBLIC_GOOGLE_MAP_ID,
  PUBLIC_SENTRY_DSN,
} from 'astro:env/client'
import { ClientScriptError } from '@components/scripts/errors'

/**
 * We are setting the VITEST env var in vitest.config.ts for unit tests.
 */
export const isUnitTest = () => {
  return typeof process !== 'undefined' && process.env['VITEST'] === 'true'
}

export const isE2eTest = () => {
  // In browser context (E2E tests with Playwright)
  if (typeof window !== 'undefined') {
    return window.isPlaywrightControlled === true
  }
  return false
}

/**
 * This is the same logic as the environmentServer isE2eTest()
 * method, for use in API endpoint serverless functions.
 */
export const isE2eTestLambda = () => {
  return typeof process !== 'undefined' && process.env['PLAYWRIGHT'] === 'true'
}

/**
 * Correctly handle checking for e2e test mode in API endpoint serverless functions
 */
export const isTest = () => {
  return isUnitTest() || isE2eTest() || isE2eTestLambda()
}

/**
 * The value of import.meta.env.MODE is included in the serverless function
 * bundle. Astro, which uses Vite under the hood, performs a static replacement
 * of import.meta.env.* variables at build time.
 */

export const isDev = () => {
  return import.meta.env.MODE === 'development'
}

export const isProd = () => {
  return import.meta.env.MODE === 'production'
}

/**
 * Package Release Utility
 *
 * Provides access to the package release version (package name and version
 * at build time from package.json) that is injected at build time via the
 * PackageRelease Astro integration. This provides a release identifier for
 * tracking regressions between numbered releases in monitoring services like
 * Sentry.
 *
 * @see src/integrations/PackageRelease/index.ts
 * @returns The package release in name@version format
 * @throws {ClientScriptError} If PACKAGE_RELEASE_VERSION is not set
 */
export function getPackageRelease(): string {
  if (!PACKAGE_RELEASE_VERSION) {
    throw new ClientScriptError(
      'PACKAGE_RELEASE_VERSION environment variable is not set. This should be injected by the PackageRelease integration.'
    )
  }
  return PACKAGE_RELEASE_VERSION
}

/**
 * Privacy Policy Version Utility
 *
 * Provides access to the privacy policy version that's injected at build time
 * via the PrivacyPolicyVersion Astro integration.
 *
 * @see src/integrations/PrivacyPolicyVersion/index.ts
 * @returns ISO timestamp string representing current privacy policy version
 * @throws {ClientScriptError} If PRIVACY_POLICY_VERSION is missing
 */
export function getPrivacyPolicyVersion(): string {
  if (!PRIVACY_POLICY_VERSION) {
    throw new ClientScriptError(
      'PRIVACY_POLICY_VERSION environment variable is not set. This should be injected by the PrivacyPolicyVersion integration.'
    )
  }
  return PRIVACY_POLICY_VERSION
}

/**
 * Gets the Google Maps API key injected at build time.
 *
 * @throws {ClientScriptError} If PUBLIC_GOOGLE_MAPS_API_KEY is not set
 */
export function getGoogleMapsApiKey(): string {
  if (!PUBLIC_GOOGLE_MAPS_API_KEY) {
    throw new ClientScriptError(
      'PUBLIC_GOOGLE_MAPS_API_KEY environment variable is not set. This is required to load Google Maps components in the browser.'
    )
  }

  return PUBLIC_GOOGLE_MAPS_API_KEY
}


/**
 * Gets the Google Maps Map ID injected at build time.
 *
 * Map IDs are required for vector maps + Advanced Markers.
 *
 * @throws {ClientScriptError} If PUBLIC_GOOGLE_MAP_ID is not set
 */
export function getGoogleMapId(): string {
  if (!PUBLIC_GOOGLE_MAP_ID) {
    throw new ClientScriptError(
      'PUBLIC_GOOGLE_MAP_ID environment variable is not set. This is required to initialize Google Maps with Advanced Markers.'
    )
  }

  return PUBLIC_GOOGLE_MAP_ID
}

/**
 * Gets the Sentry DSN key injected at build time. The Data Source Name is
 * a unique URL that tells the Sentry error monitoring SDK where to send
 * the application's error reports and events.
 *
 * @throws {ClientScriptError} If PUBLIC_SENTRY_DSN is not set
 */
export function getSentryDsn(): string {
  if (!PUBLIC_SENTRY_DSN) {
    throw new ClientScriptError(
      'PUBLIC_SENTRY_DSN environment variable is not set. This is required to initialize the Sentry client in the browser.'
    )
  }

  return PUBLIC_SENTRY_DSN
}
