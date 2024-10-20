/**
 * Articles list view  page end-to-end integration tests
 */
import { expect, test } from '@playwright/test'

test('Articles list view  page title properly set', async ({ page }) => {
  await page.goto('/articles')
  await expect(page).toHaveTitle(/Articles | Webstack Builders Company Website/)
})
