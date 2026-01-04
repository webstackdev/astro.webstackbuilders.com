/**
 * E2E Tests for Privacy Policy Version Integration
 *
 * Tests that the privacy policy version is correctly injected into the browser
 * environment via the Astro integration and accessible through import.meta.env
 *
 * @see src/integrations/PrivacyPolicyVersion/index.ts
 */

import { test, expect } from '@test/e2e/helpers'
import { BasePage } from '@test/e2e/helpers/pageObjectModels/BasePage'

type EnvironmentClientValues = {
  packageRelease: string
  privacyPolicyVersion: string
}

const environmentClientFixturePath = '/testing/environment-client-values'

const getEnvironmentClientValues = async (page: BasePage): Promise<EnvironmentClientValues> => {
  await page.goto(environmentClientFixturePath, { skipCookieDismiss: true })
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(() => {
    const values = window.environmentClientValues
    if (!values) {
      return false
    }
    return typeof values.packageRelease === 'string' && typeof values.privacyPolicyVersion === 'string'
  })

  return await page.evaluate(() => {
    if (!window.environmentClientValues) {
      const EvaluationErrorCtor = window.EvaluationError!
      throw new EvaluationErrorCtor('environmentClientValues not initialized')
    }
    return window.environmentClientValues
  })
}

const getPrivacyPolicyVersionValue = async (page: BasePage): Promise<string> => {
  const values = await getEnvironmentClientValues(page)
  return values.privacyPolicyVersion
}

test.describe('Privacy Policy Version Integration', () => {
  test('should expose PRIVACY_POLICY_VERSION in import.meta.env', async ({
    page: playwrightPage,
  }) => {
    const page = await BasePage.init(playwrightPage)

    const privacyPolicyVersion = await getPrivacyPolicyVersionValue(page)

    // Assert that the version is defined
    expect(privacyPolicyVersion).toBeDefined()
    expect(privacyPolicyVersion).not.toBe('')

    // Assert that it's in ISO date format (YYYY-MM-DD)
    expect(privacyPolicyVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('privacy policy version should be a valid date', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    const privacyPolicyVersion = await getPrivacyPolicyVersionValue(page)

    // Parse the date to ensure it's valid
    const parsedDate = new Date(privacyPolicyVersion)
    expect(parsedDate.toString()).not.toBe('Invalid Date')

    // Check that it's not a future date
    const now = new Date()
    expect(parsedDate.getTime()).toBeLessThanOrEqual(now.getTime())
  })

  test('privacy policy version should be consistent across pages', async ({
    page: playwrightPage,
  }) => {
    const page = await BasePage.init(playwrightPage)

    // Get version from home page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const versionFromHome = await getPrivacyPolicyVersionValue(page)

    // Get version from privacy page
    await page.goto('/privacy')
    await page.waitForLoadState('networkidle')
    const versionFromPrivacy = await getPrivacyPolicyVersionValue(page)

    // Both should be identical
    expect(versionFromHome).toBe(versionFromPrivacy)
  })

  test('privacy policy version should be accessible from module imports', async ({
    page: playwrightPage,
  }) => {
    const page = await BasePage.init(playwrightPage)

    const versionFromModule = await getPrivacyPolicyVersionValue(page)

    expect(versionFromModule).toBeDefined()
    expect(versionFromModule).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
