import { ActionsFunctionError } from '../errors/ActionsFunctionError'
import {
  DEV_SERVER_PORT,
  PRIVACY_POLICY_VERSION,
  PUBLIC_SENTRY_DSN,
  PUBLIC_UPSTASH_SEARCH_READONLY_TOKEN,
  PUBLIC_UPSTASH_SEARCH_REST_URL,
} from 'astro:env/client'
import {
  HUBSPOT_ACCESS_TOKEN,
  HUBSPOT_NEWSLETTER_LIST_ID,
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
  return import.meta.env.MODE === 'development' || import.meta.env.MODE === 'testing'
}

export const isProd = () => {
  return import.meta.env.MODE === 'production'
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
  const release = import.meta.env['PACKAGE_RELEASE_VERSION']

  if (!release) {
    throw new ActionsFunctionError(
      'PACKAGE_RELEASE_VERSION environment variable is not set. This should be injected by the PackageRelease integration.'
    )
  }

  return release
}

export function getHubspotAccessToken(): string {
  if (!HUBSPOT_ACCESS_TOKEN) {
    throw new ActionsFunctionError(
      'HUBSPOT_ACCESS_TOKEN environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return HUBSPOT_ACCESS_TOKEN
}

export function getHubspotNewsletterListId(): string {
  if (!HUBSPOT_NEWSLETTER_LIST_ID) {
    throw new ActionsFunctionError(
      'HUBSPOT_NEWSLETTER_LIST_ID environment variable is not set. This is required for adding contacts to the newsletter list in HubSpot.'
    )
  }
  return HUBSPOT_NEWSLETTER_LIST_ID
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
