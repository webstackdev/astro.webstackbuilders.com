/**
 * Case studies list view  page end-to-end integration tests
 */
import { expect, test } from '@playwright/test'

test('Case studies list view  page title properly set', async ({ page }) => {
  await page.goto('/case-studies')
  await expect(page).toHaveTitle(/Case Studies | Webstack Builders Company Website/)
})
