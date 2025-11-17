/**
 * This file needs to be importable by config files, so no path aliases.
 */
import { BuildError } from '../errors'

/**
 * We are setting the VITEST env var in vitest.config.ts for unit tests.
 */
export const isUnitTest = () => {
  return process.env['VITEST'] === 'true' ? true : false
}

/**
 * Environmental variable "PLAYWRIGHT" is set in a setup
 * script called by Playwright's globalSetup config hook
 */
export const isE2eTest = () => {
  return process.env['PLAYWRIGHT'] === 'true'
}

export const isTest = () => {
  return isUnitTest() || isE2eTest()
}

export const isDev = () => {
  return import.meta.env.DEV
}

export const isProd = () => {
  return import.meta.env.PROD && !isUnitTest()
}

export const isGitHub = () => {
  return !!process.env['GITHUB_ACTIONS']
}

export const isVercel = () => {
  return !!process.env['VERCEL']
}

export const isCI = () => {
  return isGitHub() || isVercel()
}

/**
 * This method is only intended to be called from astro.config.ts
 * @throws {BuildError} If SENTRY_AUTH_TOKEN is not set
 */
export function getSentryAuthToken(): string {
  const token = process.env['SENTRY_AUTH_TOKEN']
  if (!token) {
    throw new BuildError(
      'SENTRY_AUTH_TOKEN environment variable is not set. This is required for Sentry integration.',
      { phase: 'config-setup' },
    )
  }
  return token
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
 * Gets the privacy policy version from the build-time environment variable
 * @returns The privacy policy version in YYYY-MM-DD format
 * @throws {BuildError} If PRIVACY_POLICY_VERSION is not set
 */
export function getPrivacyPolicyVersion(): string {
  const version = import.meta.env['PRIVACY_POLICY_VERSION']
  if (!version) {
    throw new BuildError(
      'PRIVACY_POLICY_VERSION environment variable is not set. This should be injected by the PrivacyPolicyVersion integration.',
      { phase: 'runtime' },
    )
  }
  return version
}

/**
 * Package Release Utility
 *
 * Provides access to the package release version that's injected at build time
 * via the PackageRelease Astro integration.
 *
 * @see src/integrations/PackageRelease/index.ts
 */

/**
 * Gets the package release from the build-time environment variable
 * @returns The package release in name@version format
 * @throws {BuildError} If PACKAGE_RELEASE_VERSION is not set
 */
export function getPackageRelease(): string {
  const release = import.meta.env['PACKAGE_RELEASE_VERSION']
  if (!release) {
    throw new BuildError(
      'PACKAGE_RELEASE_VERSION environment variable is not set. This should be injected by the PackageRelease integration.',
      { phase: 'runtime' },
    )
  }
  return release
}
