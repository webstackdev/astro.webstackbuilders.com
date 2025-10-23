/**
 * Article Detail Page E2E Tests
 * Tests for individual article pages using baseTest fixtures
 */
import { test, expect, setupConsoleErrorChecker } from '@test/e2e/helpers'

test.describe('Article Detail Pages @ready', () => {
  test('first article page loads with content', async ({ page, articlePaths }) => {
    const firstArticle = articlePaths[0]
    if (!firstArticle) {
      test.skip()
      return
    }

    await page.goto(firstArticle)

    // Page should have main content container
    await expect(page.locator('main#main')).toBeVisible()

    // Should have article title
    await expect(page.locator('h1#article-title')).toBeVisible()

    // Should have article content/body
    const articleContent = page.locator('article, .article-content, [role="article"]')
    await expect(articleContent.first()).toBeVisible()
  })

  test('first article title displays correctly', async ({ page, articlePaths }) => {
    const firstArticle = articlePaths[0]
    if (!firstArticle) {
      test.skip()
      return
    }

    await page.goto(firstArticle)

    const h1 = page.locator('h1#article-title')
    await expect(h1).toBeVisible()
    await expect(h1).not.toBeEmpty()
  })

  test('first article metadata displays', async ({ page, articlePaths }) => {
    const firstArticle = articlePaths[0]
    if (!firstArticle) {
      test.skip()
      return
    }

    await page.goto(firstArticle)

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

  test('first article content renders correctly', async ({ page, articlePaths }) => {
    const firstArticle = articlePaths[0]
    if (!firstArticle) {
      test.skip()
      return
    }

    await page.goto(firstArticle)

    // Article content container should be present
    const content = page.locator('article, .article-content, [role="article"]')
    await expect(content.first()).toBeVisible()

    // Should have at least some paragraphs or content
    const paragraphs = page.locator('article p, .article-content p')
    const paragraphCount = await paragraphs.count()
    expect(paragraphCount).toBeGreaterThan(0)
  })

  test('first article has no console errors', async ({ page, articlePaths }) => {
    const firstArticle = articlePaths[0]
    if (!firstArticle) {
      test.skip()
      return
    }

    const errorChecker = setupConsoleErrorChecker(page)
    await page.goto(firstArticle)
    await page.waitForLoadState('networkidle')

    const errors = errorChecker.getFilteredErrors()
    const failed404s = errorChecker.getFiltered404s()

    expect(errors, `Console errors: ${errors.join(', ')}`).toHaveLength(0)
    expect(failed404s, `404 errors: ${failed404s.join(', ')}`).toHaveLength(0)
  })

  test('first article has no 404 errors', async ({ page, articlePaths }) => {
    const firstArticle = articlePaths[0]
    if (!firstArticle) {
      test.skip()
      return
    }

    const errorChecker = setupConsoleErrorChecker(page)
    await page.goto(firstArticle)
    await page.waitForLoadState('networkidle')

    const failed404s = errorChecker.failed404s
    expect(failed404s, `Actual 404s: ${failed404s.join(', ')}`).toHaveLength(0)
  })
})
