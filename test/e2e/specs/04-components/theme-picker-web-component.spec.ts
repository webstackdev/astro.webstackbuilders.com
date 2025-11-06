import { test, expect } from '@playwright/test'
import { setupTestPage } from '@test/e2e/helpers/cookieHelper'

test.describe('ThemePicker Web Component', () => {
  test('theme picker modal opens and closes', async ({ page }) => {
    await setupTestPage(page, '/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')    // Find the theme toggle button
    const toggleBtn = page.locator('[data-theme-toggle]')
    await expect(toggleBtn).toBeVisible()

    // Click to open theme picker
    await toggleBtn.click()

    // Wait a bit for animation
    await page.waitForTimeout(100)

    // Check if modal is visible
    const modal = page.locator('[data-theme-modal]')
    await expect(modal).toBeVisible()

    // Check if themes are visible
    const themeButtons = page.locator('[data-theme]')
    await expect(themeButtons.first()).toBeVisible()

    // Click close button
    const closeBtn = page.locator('[data-theme-close]')
    await closeBtn.click()

    // Wait for animation
    await page.waitForTimeout(500)

    // Check if modal is hidden
    await expect(modal).toBeHidden()

    console.log('✅ ThemePicker Web Component test passed!')
  })

  test('can select a theme', async ({ page }) => {
    await setupTestPage(page, '/')
    await page.waitForLoadState('networkidle')

    // Open theme picker
    await page.click('[data-theme-toggle]')
    await page.waitForTimeout(100)

    // Click on dark theme button
    await page.click('[data-theme="dark"]')

    // Wait for theme to apply
    await page.waitForTimeout(100)

    // Check if theme attribute is set on document
    const themeAttr = await page.evaluate(() => {
      return document.documentElement.dataset['theme']
    })

    expect(themeAttr).toBe('dark')

    console.log('✅ Theme selection test passed!')
  })
})
