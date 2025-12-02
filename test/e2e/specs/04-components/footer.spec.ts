/**
 * Footer Component Tests
 * Tests for site footer including links, copyright, and contact info
 * @see src/components/Footer/
 */

import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Footer Component', () => {
  test('@ready footer is visible on all pages', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    await page.expectFooter()

    // Check on another page
    await page.goto('/about')
    await page.expectFooter()
  })

  test('@ready footer contains company name/branding', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    await page.expectElementVisible('footer[role="contentinfo"]')

    // Look for company name specifically within the footer, not the entire page
    const footerText = await page.getTextContent('footer[role="contentinfo"]')
    expect(footerText).toContain('Webstack Builders')
  })

  test('@ready footer has copyright notice', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    const footerText = await page.getTextContent('footer[role="contentinfo"]')

    expect(footerText).toContain('©')
    expect(footerText).toMatch(/20\d{2}/) // Year pattern
  })

  test('@ready footer has navigation links', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    const count = await page.countElements('footer[role="contentinfo"] a[href]')
    expect(count).toBeGreaterThan(0)
  })

  test('@ready footer has legal links', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    await page.expectElementVisible('footer[role="contentinfo"] a[href*="privacy"]')
    await page.expectElementVisible('footer[role="contentinfo"] a[href*="consent"]')
  })

  test('@ready footer links are functional', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    // Dismiss cookie dialog if present
    await page.clearCookieDialog()

    // Test privacy link navigation
    await page.click('footer[role="contentinfo"] a[href*="/privacy"]')
    await page.waitForPageLoad()
    await page.waitForURL('**/privacy')
    await page.expectUrlContains('/privacy')
  })

  test('@ready footer has social media links', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')

    // Check for common social platforms
    const count = await page.countElements('footer[role="contentinfo"] a[href*="twitter"], footer[role="contentinfo"] a[href*="linkedin"], footer[role="contentinfo"] a[href*="github"]')
    expect(count).toBeGreaterThan(0)
  })

  test('@ready footer has contact information', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    const footerText = await page.getTextContent('footer[role="contentinfo"]')

    // Look for email pattern or phone pattern
    const hasEmail = /@/.test(footerText || '')
    const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(footerText || '')

    // At least one form of contact should be present
    expect(hasEmail || hasPhone).toBe(true)
  })

  test('@ready footer is responsive on mobile', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')

    await page.expectFooter()

    // Links should still be accessible
    const count = await page.countElements('footer[role="contentinfo"] a')
    expect(count).toBeGreaterThan(0)
  })

  test('@ready footer uses semantic HTML', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    await page.expectFooter()

    // Check for semantic structure
    const tagName = await playwrightPage.locator('footer').evaluate((el) => el.tagName.toLowerCase())
    expect(tagName).toBe('footer')
  })

  test('@ready footer has accessibility landmarks', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto('/')
    const role = await page.getAttribute('footer', 'role')
    const tagName = await playwrightPage.locator('footer').evaluate((el) => el.tagName.toLowerCase())

    // footer element provides contentinfo role automatically
    expect(tagName === 'footer' || role === 'contentinfo').toBe(true)
  })
})
