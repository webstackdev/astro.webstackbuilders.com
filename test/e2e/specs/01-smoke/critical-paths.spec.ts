/**
 * Critical Path Smoke Tests
 * These tests verify the most essential functionality of the site.
 * They should always pass and run quickly.
 */
import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Critical Paths @smoke', () => {
  test('@ready all main navigation pages are accessible', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    for (const { url: path, title } of page.navigationItems) {
      await page.goto(path)
      await page.expectTitle(title)
      await page.expectHeading()
    }
  })

  test('@ready navigation works across main pages', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')
    for (const { url: path } of page.navigationItems) {
      await page.click(`a[href="${path}"]`)
      // eslint-disable-next-line security/detect-non-literal-regexp
      await page.expectUrl(new RegExp(path))
    }
  })

  test('@ready footer is present on all pages', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    for (const { url: path } of page.navigationItems) {
      await page.goto(path)
      await page.expectFooter()
    }
  })

  test('@ready contact form loads and is visible', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/contact')
    await page.expectContactForm()
    await page.expectContactFormNameInput()
    await page.expectContactFormEmailInput()
    await page.expectContactFormMessageInput()
    await page.expectContactFormGdpr()
  })

  test('@ready newsletter form is present on homepage', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Newsletter form should be visible on homepage
    // Actual: Unknown - needs testing

    await page.goto('/')
    await page.expectNewsletterForm()
    await page.expectNewsletterEmailInput()
    await page.expectNewsletterGdpr()
  })

  test('@ready theme picker is accessible', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.goto('/')
    await page.expectThemePickerButton()
  })

  test('@ready cookie consent banner appears', async ({ page: playwrightPage, context }) => {
    const page = new BasePage(playwrightPage)
    // Clear consent cookies to force banner to appear
    await page.clearConsentCookies(context)
    await page.goto('/')
    await page.expectCookiesContactForm()
  })

  test('@ready main pages have no 404 errors', async ({ page: playwrightPage}) => {
    const page = new BasePage(playwrightPage)
    for (const { url: path } of page.navigationItems) {
      page.enable404Listener()
      await page.goto(path)
      expect(page.errors404, `Received 404 errors for:\n${page.errors404.join("\n")}`).toHaveLength(0)
    }
  })

  test('@ready main pages have no errors', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    for (const { url: path } of page.navigationItems) {
      await page.goto(path)
      await page.expectNoErrors()
    }
  })
})
