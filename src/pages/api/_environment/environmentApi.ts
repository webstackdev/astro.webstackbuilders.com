/**
 * Used for API endpoints. environmentClient pulls from astro:env/client
 * and references browser globals (window, document, Playwright shims, etc.). That file
 * is intentionally scoped to client bundles; Astro's SSR compiler doesn't expect server
 * routes to import it. Vercel exposes environment variables in Vercel serverless
 * functions with process.env.
 */
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { isUnitTest } from '@lib/config/environmentServer'
export {
  isCI,
  isE2eTest,
  isGitHub,
  isTest,
  isUnitTest,
  isVercel,
} from '@lib/config/environmentServer'

/**
 * The value of import.meta.env.MODE is included in the serverless function
 * bundle. Astro, which uses Vite under the hood, performs a static replacement
 * of import.meta.env.* variables at build time.
 */

export const isDev = () => {
  return import.meta.env.MODE === 'development'
}

export const isProd = () => {
  return import.meta.env.MODE === 'production' && !isUnitTest()
}

/**
 * Privacy Policy Version Utility
 *
 * Provides access to the privacy policy version that's injected at build time
 * via the PrivacyPolicyVersion Astro integration.
 *
 * @see src/integrations/PrivacyPolicyVersion/index.ts
 * @returns The privacy policy version in YYYY-MM-DD format
 * @throws {ApiFunctionError} If PRIVACY_POLICY_VERSION is not set
 */
export function getPrivacyPolicyVersion(): string {
  const version = import.meta.env['PRIVACY_POLICY_VERSION']
  if (!version) {
    throw new ApiFunctionError(
      'PRIVACY_POLICY_VERSION environment variable is not set. This should be injected by the PrivacyPolicyVersion integration.'
    )
  }
  return version
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
  const release = import.meta.env['PACKAGE_RELEASE_VERSION']
  if (!release) {
    throw new ApiFunctionError(
      'PACKAGE_RELEASE_VERSION environment variable is not set. This should be injected by the PackageRelease integration.'
    )
  }
  return release
}

/**
 * Gets the Convertkit API Key. This value is set in Vercel env vars and
 * made available to serverless functions by default. The purpose is to
 * prevent abuse of malicious parties calling cron jobs for the project.
 *
 * @throws {ApiFunctionError} If CONVERTKIT_API_KEY is not set
 */
export function getConvertkitApiKey(): string {
  const secret = process.env['CONVERTKIT_API_KEY']
  if (!secret) {
    throw new ApiFunctionError(
      'CONVERTKIT_API_KEY environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return secret
}

/**
 * Gets the Vercel cron secret. This value is set in Vercel env vars and
 * made available to serverless functions by default. The purpose is to
 * prevent abuse of malicious parties calling cron jobs for the project.
 *
 * @throws {ApiFunctionError} If CRON_SECRET is not set
 */
export function getCronSecret(): string {
  const secret = process.env['CRON_SECRET']
  if (!secret) {
    throw new ApiFunctionError(
      'CRON_SECRET environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return secret
}

/**
 * Gets the Resend API key. This value is set in Vercel env vars and
 * made available to serverless functions by default.
 *
 * @throws {ApiFunctionError} If RESEND_API_KEY is not set
 */
export function getResendApiKey(): string {
  const key = process.env['RESEND_API_KEY']
  if (!key) {
    throw new ApiFunctionError(
      'RESEND_API_KEY environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return key
}

/**
 * Gets the Sentry DSN. This value is set in Vercel env vars and
 * made available to serverless functions by default.
 *
 * @throws {ApiFunctionError} If PUBLIC_SENTRY_DSN is not set
 */
export function getSentryDsn(): string {
  const key = process.env['PUBLIC_SENTRY_DSN']
  if (!key) {
    throw new ApiFunctionError(
      'PUBLIC_SENTRY_DSN environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return key
}
