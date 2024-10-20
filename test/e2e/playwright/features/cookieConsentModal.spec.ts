/**
 * Cookie consent modal end-to-end integration tests
 */
import { expect, test } from '@playwright/test'

test('Cookie consent modal page hidden on page load', async ({ page }) => {
  await page.goto('/')
  // hidden on page load
  await expect(page.locator('#cookie-customize-modal-id')).not.toBeVisible()
  // modal appears on user interaction, so scroll page
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(page.locator('#cookie-customize-modal-id')).toBeVisible()
  // cleared with clicking close button
  await page.getByRole('button', { name: /Close cookie consent box/ }).click()
  await expect(page.locator('#cookie-customize-modal-id')).not.toBeVisible()
})
