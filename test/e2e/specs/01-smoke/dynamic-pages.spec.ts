/**
 * Dynamic Pages Smoke Test
 * Tests dynamically generated pages (articles, services, case studies)
 * Uses API to fetch actual content IDs to ensure tests work even if content changes
 */
import { BasePage, test, expect, setupConsoleErrorChecker, logConsoleErrors } from '@test/e2e/helpers'

test.describe('Dynamic Pages @smoke', () => {
  test('@ready article detail page loads', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
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
    const page = await BasePage.init(playwrightPage)
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
    const page = await BasePage.init(playwrightPage)
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
    const page = await BasePage.init(playwrightPage)
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

  test('@ready dynamic pages have no 404 errors', async ({ page: playwrightPage }, testInfo) => {
    const page = await BasePage.init(playwrightPage)

    const errorChecker = setupConsoleErrorChecker(page.page)
    const failures: string[] = []

    const resetChecker = () => {
      errorChecker.consoleErrors.length = 0
      errorChecker.failed404s.length = 0
    }

    // Test article page
    await page.goto('/articles')
    await page.waitForLoadState('networkidle')

    const firstArticleLink = page.locator('a[href*="/articles/"]').first()
    const articleUrl = await firstArticleLink.getAttribute('href')

    if (articleUrl) {
      resetChecker()
      await page.goto(articleUrl)
      await page.waitForLoadState('networkidle')

      const filtered404s = errorChecker.getFiltered404s()
      if (filtered404s.length > 0) {
        failures.push(`article: ${articleUrl}\n${filtered404s.map((url) => `  - ${url}`).join('\n')}`)
      }
    }

    // Test service page
    await page.goto('/services')
    await page.waitForLoadState('networkidle')

    const firstServiceLink = page.locator('a[href*="/services/"]').first()
    const serviceUrl = await firstServiceLink.getAttribute('href')

    if (serviceUrl) {
      resetChecker()
      await page.goto(serviceUrl)
      await page.waitForLoadState('networkidle')

      const filtered404s = errorChecker.getFiltered404s()
      if (filtered404s.length > 0) {
        failures.push(`service: ${serviceUrl}\n${filtered404s.map((url) => `  - ${url}`).join('\n')}`)
      }
    }

    // Test case study page
    await page.goto('/case-studies')
    await page.waitForLoadState('networkidle')

    const firstCaseStudyLink = page.locator('a[href*="/case-studies/"]').first()
    const caseStudyUrl = await firstCaseStudyLink.getAttribute('href')

    if (caseStudyUrl) {
      resetChecker()
      await page.goto(caseStudyUrl)
      await page.waitForLoadState('networkidle')

      const filtered404s = errorChecker.getFiltered404s()
      if (filtered404s.length > 0) {
        failures.push(`case-study: ${caseStudyUrl}\n${filtered404s.map((url) => `  - ${url}`).join('\n')}`)
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
      failures.length > 0 ? `Unexpected 404 resources:\n\n${failures.join('\n\n')}` : undefined
    ).toHaveLength(0)
  })

  test('@ready dynamic pages have no console errors', async ({ page: playwrightPage }, testInfo) => {
    const page = await BasePage.init(playwrightPage)
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
    const filteredErrors = errorChecker.getFilteredErrors()
    const filtered404s = errorChecker.getFiltered404s()

    if (filteredErrors.length > 0) {
      await testInfo.attach('console-errors', {
        body: filteredErrors.join('\n'),
        contentType: 'text/plain',
      })
    }

    if (filtered404s.length > 0) {
      await testInfo.attach('404-errors', {
        body: filtered404s.join('\n'),
        contentType: 'text/plain',
      })
    }

    expect(
      filteredErrors,
      filteredErrors.length > 0
        ? `Unexpected console errors:\n\n${filteredErrors.map((error) => `  - ${error}`).join('\n')}`
        : undefined
    ).toHaveLength(0)

    expect(
      filtered404s,
      filtered404s.length > 0
        ? `Unexpected 404 resources:\n\n${filtered404s.map((url) => `  - ${url}`).join('\n')}`
        : undefined
    ).toHaveLength(0)
  })
})
