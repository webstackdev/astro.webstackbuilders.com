/**
 * Case Studies List Page E2E Tests
 * Tests for /case-studies index page
 */
import { BasePage, test } from '@test/e2e/helpers'

test.describe('Case Studies List Page', () => {
  test('@ready page loads with correct title', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/case-studies')
    await page.expectTitle(/Case Studies/)
  })

  test('@ready hero section displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/case-studies')
    await page.expectHeading()
    await page.expectTextContains('h1', /Case Studies/)
  })

  test('@ready case studies list displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/case-studies')
    await page.expectElementVisible('.case-study-item, article')
  })

  test('@ready case study cards have required elements', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/case-studies')
    await page.expectCaseStudyCard()
  })

  test('@ready case study links are functional', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/case-studies')
    await page.expectAttribute('.case-study-item a, article a', 'href')
  })

  test('@ready clicking case study navigates to detail page', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/case-studies')
    await page.click('.case-study-item a, article a')
    await page.expectUrl(/\/case-studies\/.+/)
  })

  test('@ready page is responsive on mobile', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/case-studies')
    await page.expectHeading()
    await page.expectElementVisible('.case-study-item, article')
  })

  test('@ready page has no console errors', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/case-studies')
    await page.expectNoErrors()
  })
})
