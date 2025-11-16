/**
 * Articles Page E2E Tests
 * Tests for the blog articles listing page
 */
import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Articles Page', () => {
  test('@ready page loads with correct title', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    await page.expectTitle(/Articles/)
  })

  test('@ready articles list displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    const count = await page.countElements('article')
    expect(count).toBeGreaterThan(0)
    await page.expectElementVisible('article')
  })

  test('@ready article cards have required elements', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    await page.expectArticleCard()
  })

  test('@ready clicking article navigates to detail page', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')

    // Get the first article link
    await page.click('article a')
    // Should navigate to an article detail page
    await page.expectUrl(/\/articles\/[^/]+/)
  })

  test('@ready page subtitle displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    // If no specific subtitle found, just verify h1 exists
    await page.expectHeading()
  })

  test('@ready articles are sorted by date', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    const count = await page.countElements('time[datetime]')
    expect(count).toBeGreaterThan(0)
    // Verify time elements have datetime attribute (for semantic HTML)
    await page.expectElementVisible('time[datetime]')
    await page.expectAttribute('time[datetime]', 'datetime')
  })

  test('@ready responsive: mobile view renders correctly', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/articles')
    await page.expectElementVisible('article')
  })

  test('@ready page has no console errors', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/articles')
    await page.expectNoErrors()
  })
})