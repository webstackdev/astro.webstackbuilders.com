/**
 * Article Detail Page E2E Tests
 * Tests for individual article pages
 * Note: Tests are dynamically generated for each article
 */
import { test, expect } from '@playwright/test'
import { setupConsoleErrorChecker } from '@test/e2e/helpers/consoleErrors'
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
    test('@ready article page loads with content', async ({ page }) => {
      await page.goto(articleUrl)

      // Page should have main content container
      await expect(page.locator('main#main')).toBeVisible()

      // Should have article title
      await expect(page.locator('h1#article-title')).toBeVisible()

      // Should have article content/body
      const articleContent = page.locator('article, .article-content, [role="article"]')
      await expect(articleContent.first()).toBeVisible()
    })

    test('@ready article title displays correctly', async ({ page }) => {
      await page.goto(articleUrl)

      const h1 = page.locator('h1#article-title')
      await expect(h1).toBeVisible()

      // Title should match the expected article title
      await expect(h1).toContainText(articleTitle)
    })

    test('@ready article metadata displays', async ({ page }) => {
      await page.goto(articleUrl)

      // Should have publish date
      await expect(page.locator('time')).toBeVisible()

      // Should have author information (may be name, link, or avatar)
      const authorElement = page.locator('[data-author], .author, [rel="author"]')
      if ((await authorElement.count()) > 0) {
        await expect(authorElement.first()).toBeVisible()
      }

      // Should have tags (if article has tags)
      const tagElements = page.locator('[data-tag], .tag, .article-tag')
      if ((await tagElements.count()) > 0) {
        await expect(tagElements.first()).toBeVisible()
      }
    })

    test('@ready article content renders correctly', async ({ page }) => {
      await page.goto(articleUrl)

      // Article content container should be present
      const content = page.locator('article, .article-content, [role="article"]')
      await expect(content.first()).toBeVisible()

      // Should have at least some paragraphs or content
      const paragraphs = page.locator('article p, .article-content p')
      const paragraphCount = await paragraphs.count()
      expect(paragraphCount).toBeGreaterThan(0)
    })

    test('@ready page has no console errors', async ({ page }) => {
      const errorChecker = setupConsoleErrorChecker(page)
      await page.goto(articleUrl)
      await page.waitForLoadState('networkidle')

      const errors = errorChecker.getFilteredErrors()
      const failed404s = errorChecker.getFiltered404s()

      expect(errors, `Console errors on ${articleTitle}: ${errors.join(', ')}`).toHaveLength(0)
      expect(
        failed404s,
        `404 errors on ${articleTitle}: ${failed404s.join(', ')}`
      ).toHaveLength(0)
    })

    test('@ready page has no 404 errors', async ({ page }) => {
      const errorChecker = setupConsoleErrorChecker(page)
      await page.goto(articleUrl)
      await page.waitForLoadState('networkidle')

      const failed404s = errorChecker.failed404s
      expect(
        failed404s,
        `Actual 404s on ${articleTitle}: ${failed404s.join(', ')}`
      ).toHaveLength(0)
    })
  })
}

// Dynamically generate tests for known articles
// These will be expanded at runtime
createArticleTests('writing-library-code', 'Designing Great TypeScript Libraries')
createArticleTests('useful-vs-code-extensions', 'Useful VS Code Extensions')
