/**
 * Tags Pages E2E Tests
 * Tests for /tags index and individual tag pages
 */
import { BasePage, test } from '@test/e2e/helpers'

test.describe('Tags Index Page', () => {
  test('@ready tags index page loads', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/tags')
    await page.expectHeading()
    await page.expectTextContains('h1', /Browse by Tag/)
  })

  test('@ready tag list displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/tags')
    // Tags are shown as h2 headings linking to tag pages
    await page.expectElementVisible('h2 a[href^="/tags/"]')
  })

  test('@ready tag counts display', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/tags')
    // Each tag should show count like "5 items"
    await page.expectTextVisible(/\d+ item/)
  })

  test('@ready responsive: mobile view renders correctly', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/tags')
    await page.expectHeading()
  })

  test('@ready page has no console errors', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/tags')
    await page.expectNoErrors()
  })
})

// @TODO: Individual tag page tests are skipped because we can't dynamically determine which tags have content without accessing the content collections at runtime. These should be manually tested or implemented with dynamic tag discovery in the future.