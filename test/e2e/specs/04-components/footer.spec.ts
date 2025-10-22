/**
 * Footer Component Tests
 * Tests for site footer including links, copyright, and contact info
 * @see src/components/Footer/
 */

import { test, expect } from '@playwright/test'

test.describe('Footer Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('@ready footer is visible on all pages', async ({ page }) => {
    const footer = page.locator('footer[role="contentinfo"]')
    await expect(footer).toBeVisible()

    // Check on another page
    await page.goto('/about')
    await expect(footer).toBeVisible()
  })

  test('@ready footer contains company name/branding', async ({ page }) => {
    const footer = page.locator('footer[role="contentinfo"]')
    const companyName = footer.getByText('Webstack Builders')

    await expect(companyName.first()).toBeVisible()
  })

  test('@ready footer has copyright notice', async ({ page }) => {
    const footer = page.locator('footer[role="contentinfo"]')
    const footerText = await footer.textContent()

    expect(footerText).toContain('©')
    expect(footerText).toMatch(/20\d{2}/) // Year pattern
  })

  test('@ready footer has navigation links', async ({ page }) => {
    const footer = page.locator('footer[role="contentinfo"]')
    const links = footer.locator('a[href]')

    const count = await links.count()
    expect(count).toBeGreaterThan(0)
  })

  test('@ready footer has legal links', async ({ page }) => {
    const footer = page.locator('footer[role="contentinfo"]')

    const privacyLink = footer.locator('a[href*="privacy"]')
    const cookieLink = footer.locator('a[href*="cookie"]')

    await expect(privacyLink).toBeVisible()
    await expect(cookieLink).toBeVisible()
  })

  test.skip('@wip footer links are functional', async ({ page }) => {
    // TODO: Cookie dialog blocks this test
    const footer = page.locator('footer[role="contentinfo"]')
    const privacyLink = footer.locator('a[href*="/privacy"]').first()

    await privacyLink.click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/privacy')
  })

  test('@ready footer has social media links', async ({ page }) => {
    const footer = page.locator('footer[role="contentinfo"]')

    // Check for common social platforms
    const socialLinks = footer.locator('a[href*="twitter"], a[href*="linkedin"], a[href*="github"]')
    const count = await socialLinks.count()

    expect(count).toBeGreaterThan(0)
  })

  test('@ready footer has contact information', async ({ page }) => {
    const footer = page.locator('footer[role="contentinfo"]')
    const footerText = await footer.textContent()

    // Look for email pattern or phone pattern
    const hasEmail = /@/.test(footerText || '')
    const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(footerText || '')

    // At least one form of contact should be present
    expect(hasEmail || hasPhone).toBe(true)
  })

  test('@ready footer is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const footer = page.locator('footer[role="contentinfo"]')
    await expect(footer).toBeVisible()

    // Links should still be accessible
    const links = footer.locator('a')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
  })

  test('@ready footer uses semantic HTML', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Check for semantic structure
    const tagName = await footer.evaluate((el) => el.tagName.toLowerCase())
    expect(tagName).toBe('footer')
  })

  test('@ready footer has accessibility landmarks', async ({ page }) => {
    const footer = page.locator('footer')

    const role = await footer.getAttribute('role')
    const tagName = await footer.evaluate((el) => el.tagName.toLowerCase())

    // footer element provides contentinfo role automatically
    expect(tagName === 'footer' || role === 'contentinfo').toBe(true)
  })
})
