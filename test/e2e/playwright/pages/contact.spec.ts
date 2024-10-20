/**
 * Contact Us page end-to-end integration tests
 */
import { expect, test } from '@playwright/test'

test('Contact page title properly set', async ({ page }) => {
  await page.goto('/contact')
  await expect(page).toHaveTitle(/Contact | Webstack Builders Company Website/)
})
