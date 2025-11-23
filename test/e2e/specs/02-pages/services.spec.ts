/**
 * Services List Page E2E Tests
 * Tests for /services index page
 */
import { BasePage, test } from '@test/e2e/helpers'

test.describe('Services List Page', () => {
  test('@ready page loads with correct title', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')
    await page.expectTitle(/Services/)
  })

  test('@ready page heading displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')
    await page.expectHeading()
    await page.expectTextContains('h1', /Services/)
  })

  test('@ready services section displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')
    // Check for "Our Services" h2 heading
    await page.expectHasHeading('Our Services')
  })

  test('@ready service list displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')
    // Services are in a list with .service-item class
    await page.expectElementVisible('.service-item')
  })

  test('@ready service cards have required elements', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')
    await page.expectServiceCard()
  })

  test('@ready service links are functional', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')
    await page.expectAttribute('.service-item a', 'href')
  })

  test('@ready clicking service navigates to detail page', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')
    const href = await page.getAttribute('.service-item a', 'href')

    await page.click('.service-item a')
    await page.waitForLoadState('networkidle')
    await page.expectUrlContains(href!)
  })

  test('@ready responsive: mobile view renders correctly', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/services')
    await page.expectElementVisible('.service-item')
  })

  test('@ready page has no console errors', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')
    await page.expectNoErrors()
  })
})
