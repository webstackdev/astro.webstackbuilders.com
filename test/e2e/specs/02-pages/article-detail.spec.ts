/**
 * Article Detail Page E2E Tests
 * Tests for individual article pages
 * Note: Tests are dynamically generated for each article
 */
import { test, expect } from '@playwright/test'
import { setupConsoleErrorChecker } from '@test/e2e/helpers/console-errors'
import { fetchArticles } from '@test/e2e/helpers/content-fetchers'

// Shared article data
let articles: Array<{ id: string; title: string }> = []

// Fetch articles once before all tests
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()
  articles = await fetchArticles(page)
  await page.close()

  console.log(`Found ${articles.length} articles for testing`)
})

/**
 * Create a test suite for a specific article
 * @param articleId - The article slug/id
 * @param articleTitle - The article title for display
 */
function createArticleTests(articleId: string, articleTitle: string) {
  const articleUrl = `/articles/${articleId}`

  test.describe(`Article: ${articleTitle}`, () => {
    test('@wip article page loads with content', async ({ page }) => {
      // Expected: Article page should load with title and content
      // Actual: Unknown - needs testing
      await page.goto(articleUrl)
      await expect(page.locator('h1#article-title')).toBeVisible()
      await expect(page.locator('main#main')).toBeVisible()
    })

    test('@wip article title displays correctly', async ({ page }) => {
      // Expected: H1 should match article title from frontmatter
      // Actual: Unknown - needs testing
      await page.goto(articleUrl)
      const h1 = page.locator('h1#article-title')
      await expect(h1).toContainText(articleTitle)
    })

    test('@wip article metadata displays', async ({ page }) => {
      // Expected: Should show author, date, tags
      // Actual: Unknown - needs testing
      await page.goto(articleUrl)
      await expect(page.locator('time')).toBeVisible()
    })

    test('@wip article content renders correctly', async ({ page }) => {
      // Expected: Markdown content should be properly rendered
      // Actual: Unknown - needs testing
      await page.goto(articleUrl)
      const content = page.locator('article, .article-content')
      await expect(content).toBeVisible()
    })

    test('@wip page has no console errors', async ({ page }) => {
      // Expected: No console errors on page load
      // Actual: Unknown - needs testing
      const errorChecker = setupConsoleErrorChecker(page)
      await page.goto(articleUrl)
      await page.waitForLoadState('networkidle')

      const errors = errorChecker.getFilteredErrors()
      const failed404s = errorChecker.getFiltered404s()

      expect(errors, `Console errors: ${errors.join(', ')}`).toHaveLength(0)
      expect(failed404s, `404 errors: ${failed404s.join(', ')}`).toHaveLength(0)
    })

    test('@wip page has no 404 errors', async ({ page }) => {
      // Expected: No actual 404 errors
      // Actual: Unknown - needs testing
      const errorChecker = setupConsoleErrorChecker(page)
      await page.goto(articleUrl)
      await page.waitForLoadState('networkidle')

      const failed404s = errorChecker.failed404s
      expect(failed404s, `Actual 404s: ${failed404s.join(', ')}`).toHaveLength(0)
    })
  })
}

// Dynamically generate tests for known articles
// These will be expanded at runtime
createArticleTests('writing-library-code', 'Designing Great TypeScript Libraries')
createArticleTests('useful-vs-code-extensions', 'Useful VS Code Extensions')
