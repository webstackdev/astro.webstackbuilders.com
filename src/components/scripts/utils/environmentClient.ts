/**
 * This file cannot be used in API endpoint code. See
 * src/lib/config/environmentServer.ts for details.
 */
import {
  PACKAGE_RELEASE_VERSION,
  PRIVACY_POLICY_VERSION,
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
  return  typeof process !== 'undefined' && process.env['PLAYWRIGHT'] === 'true'
}

/**
 * Correctly handle checking for e2e test mode in API endpoint serverless functions
 */
export const isTest = () => {
  return isUnitTest() || isE2eTest() || isE2eTestLambda()
}

export const isDev = () => {
  return import.meta.env.DEV
}

export const isProd = () => {
  return import.meta.env.PROD && !isUnitTest()
}

/**
 * Privacy Policy Version Utility
 *
 * Provides access to the privacy policy version that's injected at build time
 * via the PrivacyPolicyVersion Astro integration.
 *
 * @see src/integrations/PrivacyPolicyVersion/index.ts
 */

/**
 * Provides access to the privacy policy version that is injected
 * at build time via the PrivacyPolicyVersion Astro integration.
 *
 * @returns The privacy policy version in YYYY-MM-DD format
 * @throws {ClientScriptError} If PRIVACY_POLICY_VERSION is not set
 */
export function getPrivacyPolicyVersion(): string {
  if (!PRIVACY_POLICY_VERSION) {
    throw new ClientScriptError(
      'PRIVACY_POLICY_VERSION environment variable is not set. This should be injected by the PrivacyPolicyVersion integration.',
    )
  }
  return PRIVACY_POLICY_VERSION
}

/**
 * Package Release Utility
 *
 * Provides access to the package release version that is injected at build time
 * via the PackageRelease Astro integration.
 *
 * @see src/integrations/PackageRelease/index.ts
 */

/**
 * Gets the package release from the build-time environment variable
 * @returns The package release in name@version format
 * @throws {ClientScriptError} If PACKAGE_RELEASE_VERSION is not set
 */
export function getPackageRelease(): string {
  if (!PACKAGE_RELEASE_VERSION) {
    throw new ClientScriptError(
      'PACKAGE_RELEASE_VERSION environment variable is not set. This should be injected by the PackageRelease integration.',
    )
  }
  return PACKAGE_RELEASE_VERSION
}
