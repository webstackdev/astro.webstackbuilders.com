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

/* eslint-disable import/no-unresolved */
test.describe('Privacy Policy Version Integration', () => {
  test('should expose PRIVACY_POLICY_VERSION in import.meta.env', async ({
    page: playwrightPage,
  }) => {
    const page = await BasePage.init(playwrightPage)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Execute in browser context to check if the env var is available
    const privacyPolicyVersion = await page.page.evaluate(async () => {
      // @ts-expect-error - runtime-resolved path
      const { getPrivacyPolicyVersion } = await import('/src/components/scripts/utils/environmentClient.ts')
      return getPrivacyPolicyVersion()
    })

    // Assert that the version is defined
    expect(privacyPolicyVersion).toBeDefined()
    expect(privacyPolicyVersion).not.toBe('')

    // Assert that it's in ISO date format (YYYY-MM-DD)
    expect(privacyPolicyVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('privacy policy version should be a valid date', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const privacyPolicyVersion = await page.page.evaluate(async () => {
      // @ts-expect-error - runtime-resolved path
      const { getPrivacyPolicyVersion } = await import('/src/components/scripts/utils/environmentClient.ts')
      return getPrivacyPolicyVersion()
    })

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

    const versionFromHome = await page.page.evaluate(async () => {
      // @ts-expect-error - runtime-resolved path
      const { getPrivacyPolicyVersion } = await import('/src/components/scripts/utils/environmentClient.ts')
      return getPrivacyPolicyVersion()
    })

    // Get version from privacy page
    await page.goto('/privacy')
    await page.waitForLoadState('networkidle')

    const versionFromPrivacy = await page.page.evaluate(async () => {
      // @ts-expect-error - runtime-resolved path
      const { getPrivacyPolicyVersion } = await import('/src/components/scripts/utils/environmentClient.ts')
      return getPrivacyPolicyVersion()
    })

    // Both should be identical
    expect(versionFromHome).toBe(versionFromPrivacy)
  })

  test('privacy policy version should be accessible from module imports', async ({
    page: playwrightPage,
  }) => {
    const page = await BasePage.init(playwrightPage)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Test that it can be imported and used in a module context
    const versionFromModule = await page.page.evaluate(async () => {
      // @ts-expect-error - runtime-resolved path
      const { getPrivacyPolicyVersion } = await import('/src/components/scripts/utils/environmentClient.ts')
      return getPrivacyPolicyVersion()
    })

    expect(versionFromModule).toBeDefined()
    expect(versionFromModule).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
/* eslint-enable import/no-unresolved */
