/**
 * Dynamic Pages Smoke Test
 * Tests dynamically generated pages (articles, services, case studies)
 * Uses API to fetch actual content IDs to ensure tests work even if content changes
 */
import { BasePage, test, expect, setupConsoleErrorChecker, logConsoleErrors } from '@test/e2e/helpers'

test.describe('Dynamic Pages @smoke', () => {
  test('@ready article detail page loads', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // First, visit articles list to get an actual article link
    await page.goto('/articles')
    await page.waitForLoadState('networkidle')

    // Find first article link
    const firstArticleLink = page.locator('a[href*="/articles/"]').first()
    await expect(firstArticleLink).toBeVisible()

    const articleUrl = await firstArticleLink.getAttribute('href')
    expect(articleUrl).toBeTruthy()

    // Navigate to the article
    await page.goto(articleUrl!)
    await page.waitForLoadState('networkidle')

    // Verify article page loaded with expected elements
    await expect(page.locator('main#main')).toBeVisible()
    await expect(page.locator('h1[id="article-title"]')).toBeVisible()

    // Verify we're on an article page (URL should match pattern)
    expect(page.getCurrentUrl()).toMatch(/\/articles\/.+/)
  })

  test('@ready service detail page loads', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Visit services list to get an actual service link
    await page.goto('/services')
    await page.waitForLoadState('networkidle')

    // Find first service link
    const firstServiceLink = page.locator('a[href*="/services/"]').first()
    const serviceUrl = await firstServiceLink.getAttribute('href')

    if (!serviceUrl) {
      test.skip()
      return
    }

    // Navigate to the service
    await page.goto(serviceUrl)
    await page.waitForLoadState('networkidle')

    // Verify service page loaded
    await expect(page.locator('main#main')).toBeVisible()
    await expect(page.locator('h1[id="article-title"]')).toBeVisible()

    // Verify we're on a service page
    expect(page.getCurrentUrl()).toMatch(/\/services\/.+/)
  })

  test('@ready case study detail page loads', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Visit case studies list to get an actual case study link
    await page.goto('/case-studies')
    await page.waitForLoadState('networkidle')

    // Find first case study link
    const firstCaseStudyLink = page.locator('a[href*="/case-studies/"]').first()
    const caseStudyUrl = await firstCaseStudyLink.getAttribute('href')

    if (!caseStudyUrl) {
      test.skip()
      return
    }

    // Navigate to the case study
    await page.goto(caseStudyUrl)
    await page.waitForLoadState('networkidle')

    // Verify case study page loaded
    await expect(page.locator('main#main')).toBeVisible()
    await expect(page.locator('h1[id="article-title"]')).toBeVisible()

    // Verify we're on a case study page
    expect(page.getCurrentUrl()).toMatch(/\/case-studies\/.+/)
  })

  test('@ready RSS feed is accessible', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // RSS feed should be accessible and valid XML
    const response = await page.goto('/rss.xml')
    expect(response?.status()).toBe(200)

    const contentType = response?.headers()['content-type']
    expect(contentType).toMatch(/xml/)

    // Get raw response text, not browser-rendered HTML
    const content = await response!.text()
    expect(content).toContain('<?xml')
    expect(content).toContain('<rss')
  })

  test('@ready manifest.json is accessible', async ({ page }, testInfo) => {
    // Skip Firefox due to manifest download behavior difference
    test.skip(testInfo.project.name === 'firefox', 'Firefox treats manifest.json as download')

    // PWA manifest should be accessible and valid JSON
    const response = await page.goto('/manifest.json')
    expect(response?.status()).toBe(200)

    const contentType = response?.headers()['content-type']
    expect(contentType).toMatch(/json/)

    // Get raw response text, not browser-rendered HTML
    const content = await response!.text()
    const manifest = JSON.parse(content)

    // Verify required manifest fields
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBeTruthy()
    expect(manifest.icons).toBeTruthy()
    expect(Array.isArray(manifest.icons)).toBe(true)
  })

  test('@ready dynamic pages have no 404 errors', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Test article page
    await page.goto('/articles')
    await page.waitForLoadState('networkidle')

    const firstArticleLink = page.locator('a[href*="/articles/"]').first()
    const articleUrl = await firstArticleLink.getAttribute('href')

    if (articleUrl) {
      const articleChecker = setupConsoleErrorChecker(page.page)
      await page.goto(articleUrl)
      await page.waitForLoadState('networkidle')
      expect(articleChecker.failed404s).toHaveLength(0)
    }

    // Test service page
    await page.goto('/services')
    await page.waitForLoadState('networkidle')

    const firstServiceLink = page.locator('a[href*="/services/"]').first()
    const serviceUrl = await firstServiceLink.getAttribute('href')

    if (serviceUrl) {
      const serviceChecker = setupConsoleErrorChecker(page.page)
      await page.goto(serviceUrl)
      await page.waitForLoadState('networkidle')
      expect(serviceChecker.failed404s).toHaveLength(0)
    }

    // Test case study page
    await page.goto('/case-studies')
    await page.waitForLoadState('networkidle')

    const firstCaseStudyLink = page.locator('a[href*="/case-studies/"]').first()
    const caseStudyUrl = await firstCaseStudyLink.getAttribute('href')

    if (caseStudyUrl) {
      const caseStudyChecker = setupConsoleErrorChecker(page.page)
      await page.goto(caseStudyUrl)
      await page.waitForLoadState('networkidle')
      expect(caseStudyChecker.failed404s).toHaveLength(0)
    }
  })

  test('@ready dynamic pages have no console errors', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // First, get actual article URL
    await page.goto('/articles')
    await page.waitForLoadState('networkidle')

    const firstArticleLink = page.locator('a[href*="/articles/"]').first()
    const articleUrl = await firstArticleLink.getAttribute('href')

    if (!articleUrl) {
      test.skip()
      return
    }

    // Test article detail page for errors
    const errorChecker = setupConsoleErrorChecker(page.page)

    await page.goto(articleUrl)
    await page.waitForLoadState('networkidle')

    logConsoleErrors(errorChecker)

    // Fail if there are any unexpected 404s or errors
    expect(errorChecker.getFilteredErrors()).toHaveLength(0)
    expect(errorChecker.getFiltered404s()).toHaveLength(0)
  })
})
