/**
 * Article Detail Page E2E Tests
 * Tests for individual article pages using baseTest fixtures
 */
import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Article Detail Pages @ready', () => {
  test('first article page loads with content', async ({ page: playwrightPage, articlePaths }) => {
    const firstArticle = articlePaths[0]
    if (!firstArticle) {
      test.skip()
      return
    }

    const page = await BasePage.init(playwrightPage)
    await page.goto(firstArticle)

    // Page should have main content container
    await page.expectMainElement()

    // Should have article title
    await page.expectElementVisible('h1#article-title')

    // Should have article content/body
    await page.expectElementVisible('article, .article-content, [role="article"]')
  })

  test('first article title displays correctly', async ({ page: playwrightPage, articlePaths }) => {
    const firstArticle = articlePaths[0]
    if (!firstArticle) {
      test.skip()
      return
    }

    const page = await BasePage.init(playwrightPage)
    await page.goto(firstArticle)

    await page.expectElementVisible('h1#article-title')
    await page.expectElementNotEmpty('h1#article-title')
  })

  test('first article metadata displays', async ({ page: playwrightPage, articlePaths }) => {
    const firstArticle = articlePaths[0]
    if (!firstArticle) {
      test.skip()
      return
    }

    const page = await BasePage.init(playwrightPage)
    await page.goto(firstArticle)

    // Should have publish date
    await page.expectElementVisible('time')
  })

  test('first article content renders correctly', async ({ page: playwrightPage, articlePaths }) => {
    const firstArticle = articlePaths[0]
    if (!firstArticle) {
      test.skip()
      return
    }

    const page = await BasePage.init(playwrightPage)
    await page.goto(firstArticle)

    // Article content container should be present
    await page.expectElementVisible('article, .article-content, [role="article"]')

    // Should have at least some paragraphs or content
    const paragraphCount = await page.countElements('article p, .article-content p')
    expect(paragraphCount).toBeGreaterThan(0)
  })

  test('first article has no console errors', async ({ page: playwrightPage, articlePaths }) => {
    const firstArticle = articlePaths[0]
    if (!firstArticle) {
      test.skip()
      return
    }

    const page = await BasePage.init(playwrightPage)
    await page.goto(firstArticle)
    await page.expectNoErrors()
  })

  test('first article has no 404 errors', async ({ page: playwrightPage, articlePaths }) => {
    const firstArticle = articlePaths[0]
    if (!firstArticle) {
      test.skip()
      return
    }

    const page = await BasePage.init(playwrightPage)
    await page.goto(firstArticle)
    await page.expectNoErrors()
  })
})
