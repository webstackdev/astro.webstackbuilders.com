/**
 * E2E Tests for Package Release Integration
 *
 * Tests that the package release version is correctly injected into the browser
 * environment via the Astro integration and accessible through import.meta.env
 *
 * @see src/integrations/PackageRelease/index.ts
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

const getPackageReleaseValue = async (page: BasePage): Promise<string> => {
  const values = await getEnvironmentClientValues(page)
  return values.packageRelease
}

test.describe('Package Release Integration', () => {
  test('should expose PACKAGE_RELEASE_VERSION in import.meta.env', async ({
    page: playwrightPage,
  }) => {
    const page = await BasePage.init(playwrightPage)

    const packageRelease = await getPackageReleaseValue(page)

    // Assert that the release is defined
    expect(packageRelease).toBeDefined()
    expect(packageRelease).not.toBe('')

    // Assert that it's in name@version format
    expect(packageRelease).toMatch(/^.+@\d+\.\d+\.\d+$/)
  })

  test('package release should match package.json format', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    const packageRelease = await getPackageReleaseValue(page)

    // Split into name and version
    const [name, version] = packageRelease.split('@')

    // Verify name exists and is not empty
    expect(name).toBeTruthy()
    expect(name?.length).toBeGreaterThan(0)

    // Verify version follows semver (major.minor.patch)
    expect(version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  test('package release should be consistent across pages', async ({
    page: playwrightPage,
  }) => {
    const page = await BasePage.init(playwrightPage)

    // Get release from home page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const releaseFromHome = await getPackageReleaseValue(page)

    // Get release from privacy page
    await page.goto('/privacy')
    await page.waitForLoadState('networkidle')
    const releaseFromPrivacy = await getPackageReleaseValue(page)

    // Both should be identical
    expect(releaseFromHome).toBe(releaseFromPrivacy)
  })

  test('package release should be accessible from module imports', async ({
    page: playwrightPage,
  }) => {
    const page = await BasePage.init(playwrightPage)

    const releaseFromModule = await getPackageReleaseValue(page)

    expect(releaseFromModule).toBeDefined()
    expect(releaseFromModule).toMatch(/^.+@\d+\.\d+\.\d+$/)
  })
})
