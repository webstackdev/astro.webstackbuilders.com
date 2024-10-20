/**
 * About Us page end-to-end integration tests
 */
import { expect, test } from '@playwright/test'

test('About page title properly set', async ({ page }) => {
  await page.goto('/does-not-exist')
  await expect(page).toHaveTitle(/Oops! Not Found | Webstack Builders Company Website/)
})
