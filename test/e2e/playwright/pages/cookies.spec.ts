/**
 * Cookies info page end-to-end integration tests
 */
import { expect, test } from '@playwright/test'

test('Cookies info page title properly set', async ({ page }) => {
  await page.goto('/cookies')
  await expect(page).toHaveTitle(/Cookies | Webstack Builders Company Website/)
})
