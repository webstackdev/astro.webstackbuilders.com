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
 */

/**
 * Gets the privacy policy version from the build-time environment variable
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
 * Provides access to the package release version that's injected at build time
 * via the PackageRelease Astro integration.
 *
 * @see src/integrations/PackageRelease/index.ts
 */

/**
 * Gets the package release from the build-time environment variable
 *
 * @returns The package release in name@version format
 * @throws {ApiFunctionError} If PACKAGE_RELEASE_VERSION is not set
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
 * @throws {ApiFunctionError} If SENTRY_DSN is not set
 */
export function getSentryDsn(): string {
  const key = process.env['SENTRY_DSN']
  if (!key) {
    throw new ApiFunctionError(
      'SENTRY_DSN environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return key
}

/**
 * Gets the Suprabase REST API URL token. This value is set in Vercel env vars and
 * made available to serverless functions by default.
 *
 * @throws {ApiFunctionError} If SUPABASE_URL is not set
 */
export function getSuprabaseApiUrl(): string {
  const url = process.env['SUPABASE_URL']
  if (!url) {
    throw new ApiFunctionError(
      'SUPABASE_URL environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return url
}

/**
 * Gets the Suprabase REST API URL token. This value is set in Vercel env vars and
 * made available to serverless functions by default.
 *
 * @throws {ApiFunctionError} If SUPABASE_SERVICE_ROLE_KEY is not set
 */
export function getSuprabaseApiServiceRoleKey(): string {
  const token = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!token) {
    throw new ApiFunctionError(
      'SUPABASE_SERVICE_ROLE_KEY environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return token
}

/**
 * Gets the Upstash REST API URL. This value is set in Vercel env vars and
 * made available to serverless functions by default.
 *
 * @throws {ApiFunctionError} If KV_REST_API_URL is not set
 */
export function getUpstashApiUrl(): string {
  const url = process.env['KV_REST_API_URL']
  if (!url) {
    throw new ApiFunctionError(
      'KV_REST_API_URL environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return url
}

/**
 * Gets the Upstash REST API secret token. This value is set in Vercel env vars and
 * made available to serverless functions by default.
 *
 * @throws {ApiFunctionError} If KV_REST_API_TOKEN is not set
 */
export function getUpstashApiToken(): string {
  const token = process.env['KV_REST_API_TOKEN']
  if (!token) {
    throw new ApiFunctionError(
      'KV_REST_API_TOKEN environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return token
}
