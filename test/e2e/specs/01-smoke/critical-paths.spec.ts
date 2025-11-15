/**
 * Critical Path Smoke Tests
 * These tests verify the most essential functionality of the site.
 * They should always pass and run quickly.
 */
import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Critical Paths @smoke', () => {
  test('@ready all main navigation pages are accessible', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    for (const { url: path, title } of page.navigationItems) {
      await page.goto(path)
      await page.expectTitle(title)
      await page.expectHeading()
    }
  })

  test('@ready desktop navigation works across main pages', async ({ page: playwrightPage }) => {
    // Skip if mobile viewport
    const viewport = playwrightPage.viewportSize()
    const isMobile = viewport ? viewport.width < 768 : false
    test.skip(isMobile, 'Desktop navigation test - skipping on mobile viewport')

    const page = await BasePage.init(playwrightPage)

    // Import setupTestPage here to avoid unused import warnings on other tests
    const { setupTestPage } = await import('../../helpers/cookieHelper')
    await setupTestPage(playwrightPage, '/')

    for (const { url: path } of page.navigationItems) {
      await page.click(`a[href="${path}"]`)
      // eslint-disable-next-line security/detect-non-literal-regexp
      await page.expectUrl(new RegExp(path))
    }
  })

  test('@ready mobile navigation works across main pages', async ({ page: playwrightPage }) => {
    // Skip if desktop viewport
    const viewport = playwrightPage.viewportSize()
    const isMobile = viewport ? viewport.width < 768 : false
    test.skip(!isMobile, 'Mobile navigation test - skipping on desktop viewport')

    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    const navItems = page.navigationItems
    for (let i = 0; i < navItems.length; i++) {
      const item = navItems[i]
      if (!item) continue

      const { url: path } = item

      // Open mobile menu before each navigation
      await page.click('button[aria-label="toggle menu"]')
      await playwrightPage.waitForTimeout(600) // Wait for mobile menu animation

      // Click navigation link
      await page.click(`a[href="${path}"]`)
      // eslint-disable-next-line security/detect-non-literal-regexp
      await page.expectUrl(new RegExp(path))
    }
  })

  test('@ready footer is present on all pages', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    for (const { url: path } of page.navigationItems) {
      await page.goto(path)
      await page.expectFooter()
    }
  })

  test('@ready contact form loads and is visible', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/contact')
    await page.expectContactForm()
    await page.expectContactFormNameInput()
    await page.expectContactFormEmailInput()
    await page.expectContactFormMessageInput()
    await page.expectContactFormGdpr()
  })

  test('@ready newsletter form is present on homepage', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Newsletter form should be visible on homepage
    // Actual: Unknown - needs testing

    await page.goto('/')
    await page.expectNewsletterForm()
    await page.expectNewsletterEmailInput()
    await page.expectNewsletterGdpr()
  })

  test('@ready theme picker is accessible', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    await page.expectThemePickerButton()
  })

  test('@ready cookie consent banner appears', async ({ page: playwrightPage, context }) => {
    const page = await BasePage.init(playwrightPage)
    // Clear consent cookies to force banner to appear
    await page.clearConsentCookies(context)
    await page.goto('/', { skipCookieDismiss: true })
    await page.expectCookiesContactForm()
  })

  test('@ready main pages have no 404 errors', async ({ page: playwrightPage}) => {
    const page = await BasePage.init(playwrightPage)
    for (const { url: path } of page.navigationItems) {
      page.enable404Listener()
      await page.goto(path)
      expect(page.errors404, `Received 404 errors for:\n${page.errors404.join("\n")}`).toHaveLength(0)
    }
  })

  test('@ready main pages have no errors', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    for (const { url: path } of page.navigationItems) {
      await page.goto(path)
      await page.expectNoErrors()
    }
  })
})
