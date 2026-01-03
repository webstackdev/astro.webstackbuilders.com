/**
 * Breadcrumbs Component Tests
 * Tests for breadcrumb navigation
 * @see src/components/Breadcrumbs/
 */

import {
  BreadCrumbPage,
  expect,
  test,
} from '@test/e2e/helpers'

test.describe('Breadcrumbs Component', () => {
  test('@ready breadcrumbs display on article pages', async ({ page: playwrightPage }) => {
    const page = await BreadCrumbPage.init(playwrightPage)
    await page.openFirstArticleDetail()

    await page.expectElementVisible('nav[aria-label="Breadcrumbs"]')
  })

  test('@ready breadcrumbs display on service pages', async ({ page: playwrightPage }) => {
    const page = await BreadCrumbPage.init(playwrightPage)
    await page.openFirstServiceDetail()

    await page.expectElementVisible('nav[aria-label="Breadcrumbs"]')
  })

  test('@ready breadcrumbs display on case study pages', async ({ page: playwrightPage }) => {
    const page = await BreadCrumbPage.init(playwrightPage)
    await page.openFirstCaseStudyDetail()

    await page.expectElementVisible('nav[aria-label="Breadcrumbs"]')
  })

  test('@ready breadcrumbs show correct path', async ({ page: playwrightPage }) => {
    const page = await BreadCrumbPage.init(playwrightPage)
    await page.openFirstArticleDetail()

    const count = await page.countElements('nav[aria-label="Breadcrumbs"] a')
    expect(count).toBeGreaterThan(0)

    // First link should be Home
    const firstLinkText = await page.getTextContent('nav[aria-label="Breadcrumbs"] a')
    expect(firstLinkText?.toLowerCase()).toContain('home')
  })

  test('@ready breadcrumb links are clickable', async ({ page: playwrightPage }) => {
    const page = await BreadCrumbPage.init(playwrightPage)
    await page.openFirstArticleDetail()

    await page.click('nav[aria-label="Breadcrumbs"] a')
    await page.waitForLoadState('networkidle')

    await page.expectUrlContains('localhost:4321/')
  })

  test('@ready current page is not a link', async ({ page: playwrightPage }) => {
    const page = await BreadCrumbPage.init(playwrightPage)
    await page.openFirstArticleDetail()

    // Last item should have aria-current="page" on the span, not be a link
    await page.expectElementVisible('nav[aria-label="Breadcrumbs"] li:last-child span[aria-current="page"]')

    // Verify no link in last item
    const linkCount = await page.countElements('nav[aria-label="Breadcrumbs"] li:last-child a')
    expect(linkCount).toBe(0)
  })

  test('@ready breadcrumbs have proper separators', async ({ page: playwrightPage }) => {
    const page = await BreadCrumbPage.init(playwrightPage)
    await page.openFirstArticleDetail()

    const itemCount = await page.countElements('nav[aria-label="Breadcrumbs"] li')
    expect(itemCount).toBeGreaterThan(1)

    // Check for SVG separator icon
    const separatorCount = await page.countElements('nav[aria-label="Breadcrumbs"] svg[aria-hidden="true"]')
    expect(separatorCount).toBeGreaterThan(0)
  })

  test('@ready breadcrumbs use proper ARIA', async ({ page: playwrightPage }) => {
    const page = await BreadCrumbPage.init(playwrightPage)
    await page.openFirstArticleDetail()

    await page.expectElementVisible('nav[aria-label="Breadcrumbs"]')

    // Should contain ordered list
    await page.expectElementVisible('nav[aria-label="Breadcrumbs"] ol')
  })

  test('@ready breadcrumbs are responsive', async ({ page: playwrightPage }) => {
    const page = await BreadCrumbPage.init(playwrightPage)
    await page.setViewport(375, 667)
    await page.openFirstArticleDetail()

    await page.expectElementVisible('nav[aria-label="Breadcrumbs"]')
  })

  test('@ready breadcrumbs have structured data', async ({ page: playwrightPage }) => {
    // Expected: Should include JSON-LD BreadcrumbList schema
    const page = await BreadCrumbPage.init(playwrightPage)
    await page.openFirstArticleDetail({ navigationMode: 'fresh' })

    const jsonLd = await playwrightPage.locator('script[type="application/ld+json"]').allTextContents()
    const hasBreadcrumbSchema = jsonLd.some((json) => json.includes('BreadcrumbList'))

    expect(hasBreadcrumbSchema).toBe(true)
  })
})
