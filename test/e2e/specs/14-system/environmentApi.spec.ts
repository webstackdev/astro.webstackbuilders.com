/**
 * E2E Regression Tests for API Serverless Function Environment Detection
 *
 * @see src/pages/api/_environment/environmentApi.ts
 */

import { test, expect } from '@test/e2e/helpers'
import { BasePage } from '@test/e2e/helpers/pageObjectModels/BasePage'

type EnvironmentApiSnapshot = {
  isUnitTest: boolean
  isTest: boolean
  isE2eTest: boolean
  isDev: boolean
  isProd: boolean
  packageRelease: string
  privacyPolicyVersion: string
}

const navigateToDiagnosticsPage = async (page: BasePage) => {
  await page.goto('/testing/environment-api', { skipCookieDismiss: true })
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(() => Boolean(window.environmentApiSnapshot))
}

const getEnvironmentSnapshot = async (page: BasePage): Promise<EnvironmentApiSnapshot> => {
  await navigateToDiagnosticsPage(page)
  return await page.evaluate(() => {
    if (!window.environmentApiSnapshot) {
      const EvaluationErrorCtor = window.EvaluationError!
      throw new EvaluationErrorCtor('Environment API snapshot not initialized')
    }
    return window.environmentApiSnapshot
  })
}

test.describe('Server Environment Diagnostics', () => {
  test('isTest should reflect server-side detection state', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const snapshot = await getEnvironmentSnapshot(page)
    expect(snapshot.isTest).toBe(false)
  })

  test('isDev should be true for dev-server rendering', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const snapshot = await getEnvironmentSnapshot(page)
    expect(snapshot.isDev).toBe(true)
  })

  test('isProd should be false for dev-server rendering', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const snapshot = await getEnvironmentSnapshot(page)
    expect(snapshot.isProd).toBe(false)
  })

  test('package release value should be exposed from astro:env/server', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const snapshot = await getEnvironmentSnapshot(page)
    expect(snapshot.packageRelease.length).toBeGreaterThan(0)
  })
})
