
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
