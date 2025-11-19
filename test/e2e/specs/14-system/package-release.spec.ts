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

test.describe('Package Release Integration', () => {
  test('should expose PACKAGE_RELEASE_VERSION in import.meta.env', async ({
    page: playwrightPage,
  }) => {
    const page = await BasePage.init(playwrightPage)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Execute in browser context to check if the env var is available
    const packageRelease = await page.page.evaluate(async () => {
      // @ts-expect-error - runtime-resolved path
      const { getPackageRelease } = await import('/src/components/scripts/utils/environmentClient.ts')
      return getPackageRelease()
    })

    // Assert that the release is defined
    expect(packageRelease).toBeDefined()
    expect(packageRelease).not.toBe('')

    // Assert that it's in name@version format
    expect(packageRelease).toMatch(/^.+@\d+\.\d+\.\d+$/)
  })

  test('package release should match package.json format', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const packageRelease = await page.page.evaluate(async () => {
      // @ts-expect-error - runtime-resolved path
      const { getPackageRelease } = await import('/src/components/scripts/utils/environmentClient.ts')
      return getPackageRelease()
    })

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

    const releaseFromHome = await page.page.evaluate(async () => {
      // @ts-expect-error - runtime-resolved path
      const { getPackageRelease } = await import('/src/components/scripts/utils/environmentClient.ts')
      return getPackageRelease()
    })

    // Get release from privacy page
    await page.goto('/privacy/')
    await page.waitForLoadState('networkidle')

    const releaseFromPrivacy = await page.page.evaluate(async () => {
      // @ts-expect-error - runtime-resolved path
      const { getPackageRelease } = await import('/src/components/scripts/utils/environmentClient.ts')
      return getPackageRelease()
    })

    // Both should be identical
    expect(releaseFromHome).toBe(releaseFromPrivacy)
  })

  test('package release should be accessible from module imports', async ({
    page: playwrightPage,
  }) => {
    const page = await BasePage.init(playwrightPage)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Test that it can be imported and used in a module context
    const releaseFromModule = await page.page.evaluate(async () => {
      // @ts-expect-error - runtime-resolved path
      const { getPackageRelease } = await import('/src/components/scripts/utils/environmentClient.ts')
      return getPackageRelease()
    })

    expect(releaseFromModule).toBeDefined()
    expect(releaseFromModule).toMatch(/^.+@\d+\.\d+\.\d+$/)
  })
})
