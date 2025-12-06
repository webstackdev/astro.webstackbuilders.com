/**
 * This file needs to be importable by config files, so no path aliases.
 */
import { BuildError } from '../errors/BuildError'

/**
 * Used for getting build-time and SSR serverless function environment
 */

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

/**
 * Production behaviors include functionality like using real API keys.
 * The only environment we want that behavior is during the production
 * build on Vercel.
 */

export const isDev = () => {
  return !isVercel()
}

export const isProd = () => {
  return isVercel()
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

export const getOptionalEnv = (key: string): string | undefined => {
  return process.env[key]
}
