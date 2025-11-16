/**
 * This method is only intended to be called from astro.config.ts
 */
export const getSentryAuthToken = () => {
  return process.env['SENTRY_AUTH_TOKEN']
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
