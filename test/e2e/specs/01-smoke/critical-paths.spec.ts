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
    for (const { url: path } of page.navigationItems) {
      await page.goto('/')
      const navigationComplete = page.waitForPageLoad({ requireNext: true })
      await page.navigateToPage(path)
      await navigationComplete
      await playwrightPage.waitForFunction(() => {
        return !document.documentElement.hasAttribute('data-astro-transition')
      })
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

    const navItems = page.navigationItems
    for (let i = 0; i < navItems.length; i++) {
      const item = navItems[i]
      if (!item) continue

      const { url: path } = item
      await page.goto('/')
      await page.openMobileMenu()
      const navigationComplete = page.waitForPageLoad({ requireNext: true })
      await page.click(`a[href="${path}"]`)
      await navigationComplete
      await playwrightPage.waitForFunction(() => {
        return !document.documentElement.hasAttribute('data-astro-transition')
      })
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
    await page.clearConsentCookies(context)
    await page.goto('/', { skipCookieDismiss: true })
    await page.expectCookiesContactForm()
  })

  test('@ready main pages have no 404 errors', async ({ page: playwrightPage }, testInfo) => {
    const page = await BasePage.init(playwrightPage)
    await page.enable404Listener()

    const failures: string[] = []
    for (const { url: path } of page.navigationItems) {
      page.reset404Errors()
      await page.goto(path)

      if (page.errors404.length > 0) {
        failures.push(`${path}\n${page.errors404.map((error) => `  - ${error}`).join('\n')}`)
      }
    }

    if (failures.length > 0) {
      await testInfo.attach('404-errors', {
        body: failures.join('\n\n'),
        contentType: 'text/plain',
      })
    }

    expect(
      failures,
      failures.length > 0 ? `Received 404 errors:\n\n${failures.join('\n\n')}` : undefined
    ).toHaveLength(0)
  })

  test('@ready main pages have no errors', async ({ page: playwrightPage }, testInfo) => {
    const page = await BasePage.init(playwrightPage)

    const failures: string[] = []
    for (const { url: path } of page.navigationItems) {
      await page.goto(path)

      const errors = await page.getFilteredPageErrors()
      if (errors.length > 0) {
        const formattedErrors = errors
          .map((error, index) => {
            const header = `[${index + 1}] ${error.name}: ${error.message}`
            const stack = error.stack ? `\n${error.stack}` : ''
            return `${header}${stack}`
          })
          .join('\n\n')

        failures.push(`${path}\n${formattedErrors}`)
      }
    }

    if (failures.length > 0) {
      await testInfo.attach('page-errors', {
        body: failures.join('\n\n'),
        contentType: 'text/plain',
      })
    }

    expect(
      failures,
      failures.length > 0 ? `Unexpected page errors:\n\n${failures.join('\n\n')}` : undefined
    ).toHaveLength(0)
  })
})
