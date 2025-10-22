/**
 * Case Studies List Page E2E Tests
 * Tests for /case-studies index page
 */
import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'

test.describe('Case Studies List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URLS.caseStudies)
  })

  test.skip('@wip page loads with correct title', async ({ page }) => {
    // Expected: Case studies page should have descriptive title
    // Actual: Unknown - needs testing
    await expect(page).toHaveTitle(/Case Studies/)
  })

  test.skip('@wip hero section displays', async ({ page }) => {
    // Expected: Should have hero section with heading
    // Actual: Unknown - needs testing
    await expect(page.locator('h1')).toBeVisible()
  })

  test.skip('@wip case studies grid displays', async ({ page }) => {
    // Expected: Should show grid of case study cards
    // Actual: Unknown - needs testing
    const caseStudyCards = page.locator('article')
    await expect(caseStudyCards.first()).toBeVisible()
  })

  test.skip('@wip case study cards have required elements', async ({ page }) => {
    // Expected: Each card should have image, title, description
    // Actual: Unknown - needs testing
    const firstCard = page.locator('article').first()
    await expect(firstCard.locator('img')).toBeVisible()
    await expect(firstCard.locator('h2, h3')).toBeVisible()
  })

  test.skip('@wip case study links are functional', async ({ page }) => {
    // Expected: Clicking case study should navigate to detail page
    // Actual: Unknown - needs testing
    const firstLink = page.locator('article a').first()
    await expect(firstLink).toHaveAttribute('href', /.+/)
  })

  test.skip('@wip industry/tag filtering works', async ({ page }) => {
    // Expected: If filters exist, they should work
    // Actual: Unknown - needs testing
    // Check if filter UI exists
  })

  test.skip('@wip page has no console errors', async ({ page }) => {
    // Expected: No console errors on page load
    // Actual: Unknown - needs testing
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.reload()
    expect(errors).toHaveLength(0)
  })
})
