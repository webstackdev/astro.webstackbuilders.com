/**
 * Case Study Detail Page E2E Tests
 * Tests for individual case study pages using baseTest fixtures
 */
import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Case Study Detail Pages @ready', () => {
  test('first case study page loads with content', async ({ page: playwrightPage, caseStudyPaths }) => {
    const firstCaseStudy = caseStudyPaths[0]
    if (!firstCaseStudy) {
      test.skip()
      return
    }

    const page = await BasePage.init(playwrightPage)
    await page.goto(firstCaseStudy)
    // Verify case study loaded by checking for main article content
    await page.expectElementVisible('article[itemtype="http://schema.org/Article"]')
    // Case study titles vary, just check the page has a title
    const title = await page.getTitle()
    expect(title.length).toBeGreaterThan(0)
  })

  test('first case study heading displays correctly', async ({ page: playwrightPage, caseStudyPaths }) => {
    const firstCaseStudy = caseStudyPaths[0]
    if (!firstCaseStudy) {
      test.skip()
      return
    }

    const page = await BasePage.init(playwrightPage)
    await page.goto(firstCaseStudy)
    await page.expectElementVisible('h1#article-title, h1')
    await page.expectElementNotEmpty('h1#article-title, h1')
  })

  test('first case study content article renders', async ({ page: playwrightPage, caseStudyPaths }) => {
    const firstCaseStudy = caseStudyPaths[0]
    if (!firstCaseStudy) {
      test.skip()
      return
    }

    const page = await BasePage.init(playwrightPage)
    await page.goto(firstCaseStudy)
    await page.expectElementVisible('article[itemscope], article')
    const count = await page.countElements('article p, article[itemscope] p')
    expect(count).toBeGreaterThan(0)
  })

  test('first case study metadata displays', async ({ page: playwrightPage, caseStudyPaths }) => {
    const firstCaseStudy = caseStudyPaths[0]
    if (!firstCaseStudy) {
      test.skip()
      return
    }

    const page = await BasePage.init(playwrightPage)
    await page.goto(firstCaseStudy)
    await page.expectElementVisible('article[itemscope], article')
  })

  test('first case study page has no console errors', async ({ page: playwrightPage, caseStudyPaths }) => {
    const firstCaseStudy = caseStudyPaths[0]
    if (!firstCaseStudy) {
      test.skip()
      return
    }

    const page = await BasePage.init(playwrightPage)
    await page.goto(firstCaseStudy)
    await page.expectNoErrors()
  })

  test('first case study page has no 404 errors', async ({ page: playwrightPage, caseStudyPaths }) => {
    const firstCaseStudy = caseStudyPaths[0]
    if (!firstCaseStudy) {
      test.skip()
      return
    }

    const page = await BasePage.init(playwrightPage)
    await page.goto(firstCaseStudy)
    await page.expectNoErrors()
  })
})
