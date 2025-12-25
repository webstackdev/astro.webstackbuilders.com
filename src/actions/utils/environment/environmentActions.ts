import { ActionsFunctionError } from '../errors/ActionFunctionError'
import { isUnitTest } from '@lib/config/environmentServer'
import {
  DEV_SERVER_PORT,
  PACKAGE_RELEASE_VERSION,
  PRIVACY_POLICY_VERSION,
  PUBLIC_SENTRY_DSN,
  PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN,
  PUBLIC_UPSTASH_SEARCH_REST_URL,
} from 'astro:env/client'
import {
  CONVERTKIT_API_KEY,
  RESEND_API_KEY,
} from 'astro:env/server'

export {
  isCI,
  isE2eTest,
  isGitHub,
  isTest,
  isUnitTest,
  isVercel,
} from '@lib/config/environmentServer'

export const isDev = () => {
  return import.meta.env.MODE === 'development'
}

export const isProd = () => {
  return import.meta.env.MODE === 'production' && !isUnitTest()
}

export function getDevServerPort(): number {
  if (!DEV_SERVER_PORT) {
    throw new ActionsFunctionError(
      'DEV_SERVER_PORT environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return DEV_SERVER_PORT
}

export function getPrivacyPolicyVersion(): string {
  if (!PRIVACY_POLICY_VERSION) {
    throw new ActionsFunctionError(
      'PRIVACY_POLICY_VERSION environment variable is not set. This should be injected by the PrivacyPolicyVersion integration.'
    )
  }
  return PRIVACY_POLICY_VERSION
}

export function getPackageRelease(): string {
  if (!PACKAGE_RELEASE_VERSION) {
    throw new ActionsFunctionError(
      'PACKAGE_RELEASE_VERSION environment variable is not set. This should be injected by the PackageRelease integration.'
    )
  }
  return PACKAGE_RELEASE_VERSION
}

export function getConvertkitApiKey(): string {
  if (!CONVERTKIT_API_KEY) {
    throw new ActionsFunctionError(
      'CONVERTKIT_API_KEY environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return CONVERTKIT_API_KEY
}

export function getResendApiKey(): string {
  if (!RESEND_API_KEY) {
    throw new ActionsFunctionError(
      'RESEND_API_KEY environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return RESEND_API_KEY
}

export function getSentryDsn(): string {
  if (!PUBLIC_SENTRY_DSN) {
    throw new ActionsFunctionError(
      'PUBLIC_SENTRY_DSN environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return PUBLIC_SENTRY_DSN
}

export function getUpstashUrl(): string {
  if (!PUBLIC_UPSTASH_SEARCH_REST_URL) {
    throw new ActionsFunctionError(
      'PUBLIC_UPSTASH_SEARCH_REST_URL environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return PUBLIC_UPSTASH_SEARCH_REST_URL
}

export function getUpstashPublicToken(): string {
  if (!PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN) {
    throw new ActionsFunctionError(
      'PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN
}
