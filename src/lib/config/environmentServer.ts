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

export const isCI = () => {
  return isGitHub() || isVercel()
}

export const isDev = () => {
  return !isVercel() && !isGitHub()
}

export const isProd = () => {
  return isVercel() || process.env['NODE_ENV'] === 'production'
}

/**
 * GITHUB_ACTIONS is always set to true when GitHub Actions is running the
 * workflow. You can use this variable to differentiate when tests are being
 * run locally or by GitHub Actions.
 */
export const isGitHub = () => {
  return !!process.env['GITHUB_ACTIONS']
}

/**
 * The default working directory on the runner for steps, and the default
 * location of your repository when using the checkout action. For example,
 * /home/runner/work/astro.webstackbuilders.com/astro.webstackbuilders.com
 */
export const getGitHubRepoPath = () => {
  return process.env['GITHUB_WORKSPACE']!
}

// VERCEL_ENV=production, preview, or development
export const isVercel = () => {
  return !!process.env['VERCEL'] && !isGitHub()
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
      { phase: 'config-setup' }
    )
  }
  return token
}

export const getOptionalEnv = (key: string): string | undefined => {
  return process.env[key]
}
