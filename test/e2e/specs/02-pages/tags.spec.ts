/**
 * Tags Pages E2E Tests
 * Tests for /tags index and individual tag pages
 */
import { test, expect, setupConsoleErrorChecker } from '@test/e2e/helpers'

test.describe('Tags Index Page', () => {
  test('@ready tags index page loads', async ({ page }) => {
    await page.goto('/tags')
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText(/Browse by Tag/)
  })

  test('@ready tag list displays', async ({ page }) => {
    await page.goto('/tags')
    // Tags are shown as h2 headings linking to tag pages
    const tagLinks = page.locator('h2 a[href^="/tags/"]')
    await expect(tagLinks.first()).toBeVisible()
  })

  test('@ready tag counts display', async ({ page }) => {
    await page.goto('/tags')
    // Each tag should show count like "5 items"
    const countText = page.locator('text=/\\d+ item/')
    await expect(countText.first()).toBeVisible()
  })

  test('@ready responsive: mobile view renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/tags')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('@ready page has no console errors', async ({ page }) => {
    const errorChecker = setupConsoleErrorChecker(page)
    await page.goto('/tags')
    await page.waitForLoadState('networkidle')
    expect(errorChecker.getFiltered404s().length).toBe(0)
  })
})

// Individual tag page tests are skipped because we can't dynamically determine which tags have content
// without accessing the content collections at runtime. These should be manually tested or
// implemented with dynamic tag discovery in the future.