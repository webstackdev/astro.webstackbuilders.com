/**
 * E2E Regression Tests for Client Environment Detection
 *
 * Issue: Environment detection functions should work correctly in browser context
 * Solution: Test environment utilities in actual browser environment via page.evaluate()
 *
 * @see src/components/scripts/utils/environmentClient.ts
 */

import { test, expect } from '@test/e2e/helpers'
import { BasePage } from '@test/e2e/helpers/pageObjectModels/BasePage'

type EnvironmentSnapshot = {
  isUnitTest: boolean
  isTest: boolean
  isE2eTest: boolean
  isDev: boolean
  isProd: boolean
  packageRelease: string
  privacyPolicyVersion: string
}

const navigateToDiagnosticsPage = async (page: BasePage) => {
  await page.goto('/testing/environment-client', { skipCookieDismiss: true })
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(() => Boolean(window.environmentClientSnapshot))
}

const getEnvironmentSnapshot = async (page: BasePage): Promise<EnvironmentSnapshot> => {
  await navigateToDiagnosticsPage(page)
  return await page.evaluate(() => {
    if (!window.environmentClientSnapshot) {
      throw new Error('Environment snapshot not initialized')
    }
    return window.environmentClientSnapshot
  })
}

test.describe('Client Environment Detection Regression', () => {
  test('isUnitTest should return false in browser context', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const envSnapshot = await getEnvironmentSnapshot(page)
    expect(envSnapshot.isUnitTest).toBe(false)
  })

  test('isTest should return true in browser context', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const envSnapshot = await getEnvironmentSnapshot(page)
    expect(envSnapshot.isTest).toBe(true)
  })

  test('isE2eTest should return true in browser context', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const envSnapshot = await getEnvironmentSnapshot(page)
    expect(envSnapshot.isE2eTest).toBe(true)
  })

  test('isDev should return true in browser context', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const envSnapshot = await getEnvironmentSnapshot(page)
    expect(envSnapshot.isDev).toBe(true)
  })

  test('isProd should return false in browser context', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const envSnapshot = await getEnvironmentSnapshot(page)
    expect(envSnapshot.isProd).toBe(false)
  })

  test('package release is exposed from astro:env/client', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const envSnapshot = await getEnvironmentSnapshot(page)
    expect(envSnapshot.packageRelease.length).toBeGreaterThan(0)
  })

  test('privacy policy version is exposed from astro:env/client', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    const envSnapshot = await getEnvironmentSnapshot(page)
    expect(envSnapshot.privacyPolicyVersion.length).toBeGreaterThan(0)
  })
})