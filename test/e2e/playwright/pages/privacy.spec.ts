/**
 * Privacy policy page end-to-end integration tests
 */
import { expect, test } from '@playwright/test'

test('Privacy policy page title properly set', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page).toHaveTitle(/Privacy Policy | Webstack Builders Company Website/)
})
