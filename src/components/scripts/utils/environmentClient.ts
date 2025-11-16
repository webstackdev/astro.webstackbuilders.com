
/**
 * We are setting the VITEST env var in vitest.config.ts for unit tests.
 */
export const isUnitTest = () => {
  return typeof process !== 'undefined' && !!process.env['VITEST'] === 'true'
}

export const isE2eTest = () => {
  // In browser context (E2E tests with Playwright)
  if (typeof window !== 'undefined') {
    return window.isPlaywrightControlled === true
  }
  return false
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
