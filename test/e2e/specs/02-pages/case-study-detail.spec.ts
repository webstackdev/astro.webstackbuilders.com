/**
 * Case Study Detail Page E2E Tests
 * Tests for individual case study pages using baseTest fixtures
 */
import { test, expect, setupConsoleErrorChecker } from '@test/e2e/helpers'

test.describe('Case Study Detail Pages @ready', () => {
  test('first case study page loads with content', async ({ page, caseStudyPaths }) => {
    const firstCaseStudy = caseStudyPaths[0]
    if (!firstCaseStudy) {
      test.skip()
      return
    }

    await page.goto(firstCaseStudy)
    // Verify case study loaded by checking for main article content
    await expect(page.locator('article[itemtype="http://schema.org/Article"]')).toBeVisible()
    // Case study titles vary, just check the page has a title
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })

  test('first case study heading displays correctly', async ({ page, caseStudyPaths }) => {
    const firstCaseStudy = caseStudyPaths[0]
    if (!firstCaseStudy) {
      test.skip()
      return
    }

    await page.goto(firstCaseStudy)
    const h1 = page.locator('h1#article-title, h1').first()
    await expect(h1).toBeVisible()
    await expect(h1).not.toBeEmpty()
  })

  test('first case study content article renders', async ({ page, caseStudyPaths }) => {
    const firstCaseStudy = caseStudyPaths[0]
    if (!firstCaseStudy) {
      test.skip()
      return
    }

    await page.goto(firstCaseStudy)
    const article = page.locator('article[itemscope], article').first()
    await expect(article).toBeVisible()
    const paragraphs = article.locator('p')
    const count = await paragraphs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('first case study metadata displays', async ({ page, caseStudyPaths }) => {
    const firstCaseStudy = caseStudyPaths[0]
    if (!firstCaseStudy) {
      test.skip()
      return
    }

    await page.goto(firstCaseStudy)
    const article = page.locator('article[itemscope], article').first()
    await expect(article).toBeVisible()
  })

  test('first case study page has no console errors', async ({ page, caseStudyPaths }) => {
    const firstCaseStudy = caseStudyPaths[0]
    if (!firstCaseStudy) {
      test.skip()
      return
    }

    const errorChecker = setupConsoleErrorChecker(page)
    await page.goto(firstCaseStudy)
    await page.waitForLoadState('networkidle')
    expect(errorChecker.getFilteredErrors()).toHaveLength(0)
  })

  test('first case study page has no 404 errors', async ({ page, caseStudyPaths }) => {
    const firstCaseStudy = caseStudyPaths[0]
    if (!firstCaseStudy) {
      test.skip()
      return
    }

    const errorChecker = setupConsoleErrorChecker(page)
    await page.goto(firstCaseStudy)
    await page.waitForLoadState('networkidle')
    expect(errorChecker.getFiltered404s()).toHaveLength(0)
  })
})
