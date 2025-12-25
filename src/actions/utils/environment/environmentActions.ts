import { ActionsFunctionError } from '@actions/utils/errors/ActionsFunctionError'
import { getOptionalEnv, isUnitTest } from '@lib/config/environmentServer'
export {
  isCI,
  isE2eTest,
  isGitHub,
  isTest,
  isUnitTest,
  isVercel,
} from '@lib/config/environmentServer'

export { getOptionalEnv } from '@lib/config/environmentServer'

export const isDev = () => {
  return import.meta.env.MODE === 'development'
}

export const isProd = () => {
  return import.meta.env.MODE === 'production' && !isUnitTest()
}

export function getPrivacyPolicyVersion(): string {
  const version = import.meta.env['PRIVACY_POLICY_VERSION']
  if (!version) {
    throw new ActionsFunctionError(
      'PRIVACY_POLICY_VERSION environment variable is not set. This should be injected by the PrivacyPolicyVersion integration.'
    )
  }
  return version
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

export function getConvertkitApiKey(): string {
  const secret = getOptionalEnv('CONVERTKIT_API_KEY')
  if (!secret) {
    throw new ActionsFunctionError(
      'CONVERTKIT_API_KEY environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return secret
}

export function getResendApiKey(): string {
  const key = getOptionalEnv('RESEND_API_KEY')
  if (!key) {
    throw new ActionsFunctionError(
      'RESEND_API_KEY environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return key
}

export function getSentryDsn(): string {
  const key = getOptionalEnv('PUBLIC_SENTRY_DSN')
  if (!key) {
    throw new ActionsFunctionError(
      'PUBLIC_SENTRY_DSN environment variable is not set. This is either set in a .env file locally during development, in GitHub Secrets and made available in CI runs by the .github/workflows actions, or by Vercel as an env var made available to serverless functions in deployment.'
    )
  }
  return key
}
