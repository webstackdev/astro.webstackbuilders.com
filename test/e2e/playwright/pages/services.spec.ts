/**
 * Services list view page end-to-end integration tests
 */
import { expect, test } from '@playwright/test'

test('Services list view  page title properly set', async ({ page }) => {
  await page.goto('/services')
  await expect(page).toHaveTitle(/Services | Webstack Builders Company Website/)
})
