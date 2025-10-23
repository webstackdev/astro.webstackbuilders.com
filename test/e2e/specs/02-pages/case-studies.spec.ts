/**
 * Case Studies List Page E2E Tests
 * Tests for /case-studies index page
 */
import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'
import { setupConsoleErrorChecker } from '@test/e2e/helpers/consoleErrors'

test.describe('Case Studies List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URLS.caseStudies)
  })

  test('@ready page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Case Studies/)
  })

  test('@ready hero section displays', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('h1')).toContainText(/Case Studies/)
  })

  test('@ready case studies list displays', async ({ page }) => {
    const caseStudyList = page.locator('.case-study-item, article')
    await expect(caseStudyList.first()).toBeVisible()
  })

    test('@ready case study cards have required elements', async ({ page }) => {
    const caseStudyList = page.locator('.case-study-item, article')
    const firstCard = caseStudyList.first()
    const heading = firstCard.locator('h2, h3').first()
    await expect(heading).toBeVisible()
    await expect(firstCard.locator('a').first()).toBeVisible()
  })

  test('@ready case study links are functional', async ({ page }) => {
    const firstLink = page.locator('.case-study-item a, article a').first()
    await expect(firstLink).toHaveAttribute('href', /\/case-studies\//)
  })

  test('@ready clicking case study navigates to detail page', async ({ page }) => {
    const firstLink = page.locator('.case-study-item a, article a').first()
    await firstLink.click()
    await expect(page).toHaveURL(/\/case-studies\/.+/)
  })

  test('@ready page is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('h1')).toBeVisible()
    const caseStudyCards = page.locator('.case-study-item, article')
    await expect(caseStudyCards.first()).toBeVisible()
  })

  test('@ready page has no console errors', async ({ page }) => {
    const errorChecker = setupConsoleErrorChecker(page)
    await page.reload()
    expect(errorChecker.getFilteredErrors()).toHaveLength(0)
  })
})
