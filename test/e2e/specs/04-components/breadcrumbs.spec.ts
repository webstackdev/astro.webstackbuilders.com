/**
 * Breadcrumbs Component Tests
 * Tests for breadcrumb navigation
 * @see src/components/Breadcrumbs/
 */

import {
  BasePage,
  expect,
  setupTestPage,
  test,
 } from '@test/e2e/helpers'

test.describe('Breadcrumbs Component', () => {
  test('@ready breadcrumbs display on article pages', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await setupTestPage(playwrightPage, '/articles')
    await page.click('a[href*="/articles/"]')
    await page.waitForLoadState('networkidle')

    await page.expectElementVisible('nav[aria-label="Breadcrumb"]')
  })

  test('@ready breadcrumbs display on service pages', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await setupTestPage(playwrightPage, '/services')
    await page.click('a[href*="/services/"]')
    await page.waitForLoadState('networkidle')

    await page.expectElementVisible('nav[aria-label="Breadcrumb"]')
  })

  test('@ready breadcrumbs show correct path', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await setupTestPage(playwrightPage, '/articles')
    await page.click('a[href*="/articles/"]')
    await page.waitForLoadState('networkidle')

    const count = await page.countElements('nav[aria-label="Breadcrumb"] a')
    expect(count).toBeGreaterThan(0)

    // First link should be Home
    const firstLinkText = await page.getTextContent('nav[aria-label="Breadcrumb"] a')
    expect(firstLinkText?.toLowerCase()).toContain('home')
  })

  test('@ready breadcrumb links are clickable', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await setupTestPage(playwrightPage, '/articles')
    await page.click('a[href*="/articles/"]')
    await page.waitForLoadState('networkidle')

    await page.click('nav[aria-label="Breadcrumb"] a')
    await page.waitForLoadState('networkidle')

    await page.expectUrlContains('localhost:4321/')
  })

  test('@ready current page is not a link', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await setupTestPage(playwrightPage, '/articles')
    await page.click('a[href*="/articles/"]')
    await page.waitForLoadState('networkidle')

    // Last item should have aria-current="page" on the span, not be a link
    await page.expectElementVisible('nav[aria-label="Breadcrumb"] li:last-child span[aria-current="page"]')

    // Verify no link in last item
    const linkCount = await page.countElements('nav[aria-label="Breadcrumb"] li:last-child a')
    expect(linkCount).toBe(0)
  })

  test('@ready breadcrumbs have proper separators', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await setupTestPage(playwrightPage, '/articles')
    await page.click('a[href*="/articles/"]')
    await page.waitForLoadState('networkidle')

    const itemCount = await page.countElements('nav[aria-label="Breadcrumb"] li')
    expect(itemCount).toBeGreaterThan(1)

    // Check for SVG separator icon
    const separatorCount = await page.countElements('nav[aria-label="Breadcrumb"] svg[aria-hidden="true"]')
    expect(separatorCount).toBeGreaterThan(0)
  })

  test('@ready breadcrumbs use proper ARIA', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await setupTestPage(playwrightPage, '/articles')
    await page.click('a[href*="/articles/"]')
    await page.waitForLoadState('networkidle')

    await page.expectElementVisible('nav[aria-label="Breadcrumb"]')

    // Should contain ordered list
    await page.expectElementVisible('nav[aria-label="Breadcrumb"] ol')
  })

  test('@ready breadcrumbs are responsive', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.setViewport(375, 667)
    await setupTestPage(playwrightPage, '/articles')

    await page.click('a[href*="/articles/"]', { force: true }) // Bypass cookie dialog overlay
    await page.waitForLoadState('networkidle')

    await page.expectElementVisible('nav[aria-label="Breadcrumb"]')
  })

  test.skip('@wip breadcrumbs have structured data', async ({ page: playwrightPage }) => {
    // Expected: Should include JSON-LD BreadcrumbList schema
    const page = new BasePage(playwrightPage)
    await setupTestPage(playwrightPage, '/articles')
    await page.click('a[href*="/articles/"]')
    await page.waitForLoadState('networkidle')

    const jsonLd = await playwrightPage.locator('script[type="application/ld+json"]').allTextContents()
    const hasBreadcrumbSchema = jsonLd.some((json) => json.includes('BreadcrumbList'))

    expect(hasBreadcrumbSchema).toBe(true)
  })

  test('@ready breadcrumbs truncate long titles', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await setupTestPage(playwrightPage, '/articles')
    await page.click('a[href*="/articles/"]')
    await page.waitForLoadState('networkidle')

    const hasEllipsis = await playwrightPage.locator('nav[aria-label="Breadcrumb"] li').last().evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.textOverflow === 'ellipsis' || styles.overflow === 'hidden'
    })

    // Test passes if either truncation is applied or text is reasonably short
    const text = await page.getTextContent('nav[aria-label="Breadcrumb"] li:last-child')
    expect(hasEllipsis || (text && text.length < 50)).toBe(true)
  })
})
