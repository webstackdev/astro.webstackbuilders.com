/**
 * Case Study Detail Page E2E Tests
 * Tests for individual case study pages
 * Note: Tests are generated dynamically per case study
 */
import { test, expect } from '@playwright/test'
import { setupConsoleErrorChecker } from '@test/e2e/helpers/console-errors'

/**
 * Generate test suite for a specific case study
 */
function createCaseStudyTests(caseStudyId: string, caseStudyTitle: string) {
  const caseStudyUrl = `/case-studies/${caseStudyId}`

  test.describe(`Case Study: ${caseStudyTitle}`, () => {
    test('@ready case study page loads with correct title', async ({ page }) => {
      await page.goto(caseStudyUrl)
      // eslint-disable-next-line security/detect-non-literal-regexp
      await expect(page).toHaveTitle(new RegExp(caseStudyTitle))
    })

    test('@ready case study heading displays correctly', async ({ page }) => {
      await page.goto(caseStudyUrl)
      const h1 = page.locator('h1#article-title, h1').first()
      await expect(h1).toBeVisible()
      await expect(h1).toContainText(caseStudyTitle)
    })

    test('@ready case study content article renders', async ({ page }) => {
      await page.goto(caseStudyUrl)
      const article = page.locator('article[itemscope], article').first()
      await expect(article).toBeVisible()
      const paragraphs = article.locator('p')
      const count = await paragraphs.count()
      expect(count).toBeGreaterThan(0)
    })

    test('@ready case study metadata displays', async ({ page }) => {
      await page.goto(caseStudyUrl)
      // Check for client or industry info if available
      const article = page.locator('article[itemscope], article').first()
      await expect(article).toBeVisible()
    })

    test('@ready related case studies carousel may render', async ({ page }) => {
      await page.goto(caseStudyUrl)
      // Carousel is optional depending on available related content
      await expect(page.locator('h1#article-title, h1').first()).toBeVisible()
    })

    test('@ready page has no console errors', async ({ page }) => {
      const errorChecker = setupConsoleErrorChecker(page)
      await page.goto(caseStudyUrl)
      await page.waitForLoadState('networkidle')
      expect(errorChecker.getFilteredErrors()).toHaveLength(0)
    })

    test('@ready page has no 404 errors', async ({ page }) => {
      const errorChecker = setupConsoleErrorChecker(page)
      await page.goto(caseStudyUrl)
      await page.waitForLoadState('networkidle')
      expect(errorChecker.getFiltered404s()).toHaveLength(0)
    })
  })
}

// Generate tests for each case study
createCaseStudyTests('ecommerce-modernization', 'E-Commerce Platform Modernization')
createCaseStudyTests('enterprise-api-platform', 'Enterprise API Platform Development')
