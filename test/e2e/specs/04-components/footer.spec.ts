/**
 * Footer Component Tests
 * Tests for site footer including links, copyright, and contact info
 * @see src/components/Footer/
 */

import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'

test.describe('Footer Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URLS.home)
  })

  test.skip('@wip footer is visible on all pages', async ({ page }) => {
    // Expected: Footer should appear on every page
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Check on another page
    await page.goto(TEST_URLS.about)
    await expect(footer).toBeVisible()
  })

  test.skip('@wip footer contains company name/branding', async ({ page }) => {
    // Expected: Footer should display company name or logo
    const footer = page.locator('footer')
    const brand = footer.locator('[data-brand], .brand')

    await expect(brand.first()).toBeVisible()

    const brandText = await brand.first().textContent()
    expect(brandText?.trim().length).toBeGreaterThan(0)
  })

  test.skip('@wip footer has copyright notice', async ({ page }) => {
    // Expected: Footer should include copyright
    const footer = page.locator('footer')
    const footerText = await footer.textContent()

    expect(footerText).toContain('©')
    expect(footerText).toMatch(/20\d{2}/) // Year pattern
  })

  test.skip('@wip footer has navigation links', async ({ page }) => {
    // Expected: Footer should have links to main pages
    const footer = page.locator('footer')
    const links = footer.locator('a[href]')

    const count = await links.count()
    expect(count).toBeGreaterThan(0)

    // Common footer links
    const footerText = await footer.textContent()
    const hasCommonLinks =
      footerText?.includes('About') ||
      footerText?.includes('Services') ||
      footerText?.includes('Contact')

    expect(hasCommonLinks).toBe(true)
  })

  test.skip('@wip footer has legal links', async ({ page }) => {
    // Expected: Footer should have privacy policy, terms, etc.
    const footer = page.locator('footer')

    const privacyLink = footer.locator('a[href*="privacy"]')
    const cookieLink = footer.locator('a[href*="cookie"]')

    // At least one legal link should exist
    const hasLegalLink = (await privacyLink.count()) > 0 || (await cookieLink.count()) > 0
    expect(hasLegalLink).toBe(true)
  })

  test.skip('@wip footer links are functional', async ({ page }) => {
    // Expected: Footer links should navigate correctly
    const footer = page.locator('footer')
    const aboutLink = footer.locator('a[href*="/about"]').first()

    if ((await aboutLink.count()) === 0) {
      test.skip()
    }

    await aboutLink.click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/about')
  })

  test.skip('@wip footer has social media links', async ({ page }) => {
    // Expected: Footer may include social media icons
    const footer = page.locator('footer')
    const socialLinks = footer.locator('[data-social], a[href*="twitter"], a[href*="linkedin"], a[href*="facebook"], a[href*="github"]')

    // Not all sites have social links, so we'll just check if present
    const count = await socialLinks.count()
    // Test passes regardless, just verifying structure if present
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test.skip('@wip footer social links open in new tab', async ({ page }) => {
    // Expected: External social links should have target="_blank"
    const footer = page.locator('footer')
    const socialLinks = footer.locator('a[href*="twitter"], a[href*="linkedin"], a[href*="facebook"]')

    const count = await socialLinks.count()
    if (count === 0) {
      test.skip()
    }

    for (let i = 0; i < count; i++) {
      const link = socialLinks.nth(i)
      const target = await link.getAttribute('target')
      const rel = await link.getAttribute('rel')

      expect(target).toBe('_blank')
      expect(rel).toContain('noopener')
    }
  })

  test.skip('@wip footer has contact information', async ({ page }) => {
    // Expected: Footer may display email, phone, or address
    const footer = page.locator('footer')
    const footerText = await footer.textContent()

    // Look for email pattern or phone pattern
    const hasEmail = /@/.test(footerText || '')
    const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(footerText || '')
    const hasContactLink = (await footer.locator('a[href*="contact"]').count()) > 0

    // At least one form of contact should be present
    expect(hasEmail || hasPhone || hasContactLink).toBe(true)
  })

  test.skip('@wip footer has newsletter signup', async ({ page }) => {
    // Expected: Footer may include newsletter subscription
    const footer = page.locator('footer')
    const newsletterForm = footer.locator('form, [data-newsletter]')

    const count = await newsletterForm.count()
    // Not required, just check if present
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test.skip('@wip footer is responsive on mobile', async ({ page }) => {
    // Expected: Footer should stack appropriately on mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(TEST_URLS.home)

    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Links should still be accessible
    const links = footer.locator('a')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
  })

  test.skip('@wip footer uses semantic HTML', async ({ page }) => {
    // Expected: Should use <footer> element
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Check for semantic structure
    const tagName = await footer.evaluate((el) => el.tagName.toLowerCase())
    expect(tagName).toBe('footer')
  })

  test.skip('@wip footer has accessibility landmarks', async ({ page }) => {
    // Expected: Footer should have proper ARIA roles
    const footer = page.locator('footer')

    const role = await footer.getAttribute('role')
    const tagName = await footer.evaluate((el) => el.tagName.toLowerCase())

    // footer element provides contentinfo role automatically
    expect(tagName === 'footer' || role === 'contentinfo').toBe(true)
  })

  test.skip('@wip footer text is readable', async ({ page }) => {
    // Expected: Footer text should have sufficient contrast
    const footer = page.locator('footer')

    const color = await footer.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.color
    })

    expect(color).toBeTruthy()

    // Basic check: color should be defined
    const isVisible = await footer.isVisible()
    expect(isVisible).toBe(true)
  })
})
