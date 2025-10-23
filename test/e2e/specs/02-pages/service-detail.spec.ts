/**
 * Service Detail Page E2E Tests
 * Tests for individual service pages using baseTest fixtures
 */
import { test, expect, setupConsoleErrorChecker } from '@test/e2e/helpers'

test.describe('Service Detail Pages @ready', () => {
  test('first service page loads with content', async ({ page, servicePaths }) => {
    const firstService = servicePaths[0]
    if (!firstService) {
      test.skip()
      return
    }

    await page.goto(firstService)
    await page.waitForLoadState('networkidle')

    const main = page.locator('main')
    await expect(main).toBeVisible()

    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()

    const article = page.locator('article[itemscope]')
    await expect(article).toBeVisible()
  })

  test('first service title displays correctly', async ({ page, servicePaths }) => {
    const firstService = servicePaths[0]
    if (!firstService) {
      test.skip()
      return
    }

    await page.goto(firstService)
    const heading = page.locator('h1#article-title')
    await expect(heading).toBeVisible()
    await expect(heading).not.toBeEmpty()
  })

  test('first service content renders', async ({ page, servicePaths }) => {
    const firstService = servicePaths[0]
    if (!firstService) {
      test.skip()
      return
    }

    await page.goto(firstService)
    const content = page.locator('article p')
    await expect(content.first()).toBeVisible()
  })

  test('first service page has no console errors', async ({ page, servicePaths }) => {
    const firstService = servicePaths[0]
    if (!firstService) {
      test.skip()
      return
    }

    const errorChecker = setupConsoleErrorChecker(page)
    await page.goto(firstService)
    await page.waitForLoadState('networkidle')

    const filtered404s = errorChecker.getFiltered404s()
    expect(filtered404s.length).toBe(0)
  })

  test('first service page has no 404 errors', async ({ page, servicePaths }) => {
    const firstService = servicePaths[0]
    if (!firstService) {
      test.skip()
      return
    }

    const errorChecker = setupConsoleErrorChecker(page)
    await page.goto(firstService)
    await page.waitForLoadState('networkidle')

    const all404s = errorChecker.failed404s
    expect(all404s.length).toBe(0)
  })
})
