/**
 * About Us page end-to-end integration tests
 */
import { expect, test } from '@playwright/test'

test('About page title properly set', async ({ page }) => {
  await page.goto('/about')
  await expect(page).toHaveTitle(/About | Webstack Builders Company Website/)
})
