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
    await page.expectTextContains('h1', /My Services/)
  })

  test('@ready service list displays', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')
    await page.expectElementVisible('article[data-service-card]')
  })

  test('@ready service cards have required elements', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')
    await page.expectServiceCard()
  })

  test('@ready service links are functional', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')
    await page.expectAttribute('a[data-service-contact-link]', 'href')
  })

  test('@ready clicking service navigates to contact page with service context', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')
    const href = await page.getAttribute('a[data-service-contact-link]', 'href')

    await page.click('a[data-service-contact-link]')
    await page.waitForURL(url => `${url.pathname}${url.search}` === href)
    await page.expectTextContains('h1', /Contact Me/)
  })

  test('@ready responsive: mobile view renders correctly', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/services')
    await page.expectElementVisible('article[data-service-card]')
  })

  test('@ready page has no console errors', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/services')
    await page.expectNoErrors()
  })
})
