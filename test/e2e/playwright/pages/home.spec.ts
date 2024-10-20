/**
 * Home page end-to-end integration tests
 */
import { expect, test } from '@playwright/test'

test('Home page title properly set', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/') // no redirect
  //await expect(page).not.toHaveURL('error')
  await expect(page).toHaveTitle(/Webstack Builders Company Website/)
})
