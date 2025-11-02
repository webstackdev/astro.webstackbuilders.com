/**
 * Regression Tests for Theme Picker with View Transitions
 *
 * Issue: Theme picker button stopped working after navigating to another page
 * Root Cause: Scripts using 'delayed' eventType didn't reinitialize on View Transitions
 * Fix: Migrated to Web Component pattern with connectedCallback/disconnectedCallback lifecycle
 *
 * @see src/components/ThemePicker/theme-picker-element.ts
 */

import { test, expect } from '@test/e2e/helpers'
import { setupTestPage } from '@test/e2e/helpers/cookieHelper'

/**
 * Helper function to handle mobile navigation
 */
async function navigateWithMobileSupport(page: import('@playwright/test').Page, selector: string) {
  const viewport = page.viewportSize()
  const isMobile = viewport && viewport.width < 768

  if (isMobile) {
    // Open mobile menu first
    await page.locator('button[aria-label="toggle menu"]').click()
    await page.waitForTimeout(600) // Wait for mobile menu animation
  }

  // Click the first navigation link
  await page.locator(selector).first().click()

  // Wait for navigation to complete
  await page.waitForLoadState('networkidle')

  // On mobile, the menu should automatically close after navigation
  // But let's ensure it's closed by checking and closing if needed
  if (isMobile) {
    const menuToggle = page.locator('button[aria-label="toggle menu"]')
    const isExpanded = await menuToggle.getAttribute('aria-expanded')
    if (isExpanded === 'true') {
      await menuToggle.click()
      await page.waitForTimeout(600) // Wait for close animation
    }
  }
}

test.describe('Theme Picker - View Transitions Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and dismiss cookie modal before each test
    await setupTestPage(page, '/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('theme picker button works after View Transition navigation', async ({ page }) => {
    // 1. Verify theme picker works on initial page load
    const themeToggleBtn = page.locator('.theme-toggle-btn').first()
    await expect(themeToggleBtn).toBeVisible()

    // Click to open theme picker
    await themeToggleBtn.click()
    await expect(themeToggleBtn).toHaveAttribute('aria-expanded', 'true')

    // Close theme picker
    const closeBtn = page.locator('.themepicker__closeBtn').first()
    await closeBtn.click()
    await expect(themeToggleBtn).toHaveAttribute('aria-expanded', 'false')

    // 2. Navigate to another page using an internal link
    // Navigate using mobile-aware helper
    await navigateWithMobileSupport(page, '.main-nav-item a')

    // 3. Verify theme picker button still works after navigation
    const themeToggleBtnAfterNav = page.locator('.theme-toggle-btn').first()
    await expect(themeToggleBtnAfterNav).toBeVisible()

    // Click to open theme picker - this was broken before the fix
    await themeToggleBtnAfterNav.click()
    await expect(themeToggleBtnAfterNav).toHaveAttribute('aria-expanded', 'true')

    // Verify theme picker modal is actually open
    const themePicker = page.locator('.themepicker').first()
    await expect(themePicker).toHaveClass(/is-open/)
  })

  test('theme picker can select themes after View Transition navigation', async ({ page }) => {
    // Navigate to another page first using mobile-aware helper
    await navigateWithMobileSupport(page, '.main-nav-item a')

    // 2. Open theme picker
    const themeToggleBtn = page.locator('.theme-toggle-btn').first()
    await themeToggleBtn.click()
    await expect(themeToggleBtn).toHaveAttribute('aria-expanded', 'true')

    // 3. Select dark theme
    const darkThemeBtn = page.locator('.themepicker__selectBtn[data-theme="dark"]').first()
    await darkThemeBtn.click()

    // 4. Verify dark theme is applied
    const htmlElement = page.locator('html')
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark')

    // 5. Verify the button has the active class
    const darkThemeItem = darkThemeBtn.locator('..')
    await expect(darkThemeItem).toHaveClass(/is-active/)
  })

  test('theme picker works after multiple navigations', async ({ page }) => {
    // Navigate through multiple pages to ensure script reinitializes each time
    const navLinks = page.locator('.main-nav-item a')
    const linkCount = await navLinks.count()

    // Navigate to first 3 links (or all if less than 3)
    const navigationsToTest = Math.min(3, linkCount)

    for (let i = 0; i < navigationsToTest; i++) {
      // Use mobile-aware navigation helper
      await navigateWithMobileSupport(page, `.main-nav-item a >> nth=${i}`)

      // Verify theme picker still works
      const themeToggleBtn = page.locator('.theme-toggle-btn').first()
      await expect(themeToggleBtn).toBeVisible()
      await themeToggleBtn.click()
      await expect(themeToggleBtn).toHaveAttribute('aria-expanded', 'true')

      // Modal now stays open when selecting themes - close it manually before next iteration
      await themeToggleBtn.click()
      await expect(themeToggleBtn).toHaveAttribute('aria-expanded', 'false')
    }
  })

  test('theme preference persists across View Transitions', async ({ page }) => {
    // 1. Select dark theme on home page
    const themeToggleBtn = page.locator('.theme-toggle-btn').first()
    await themeToggleBtn.click()

    const darkThemeBtn = page.locator('.themepicker__selectBtn[data-theme="dark"]').first()
    await darkThemeBtn.click()

    // Wait for theme to be applied and picker to close
    await page.waitForTimeout(500)

    // 2. Navigate to another page using mobile-aware helper
    await navigateWithMobileSupport(page, '.main-nav-item a')

    // 3. Verify dark theme is still applied
    const htmlElement = page.locator('html')
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark')

    // 4. Verify theme picker modal stays open after selecting theme and navigating
    // Note: The modal stays open because $themePickerOpen persists the state
    const themePickerAfterNav = page.locator('.themepicker').first()
    await expect(themePickerAfterNav).toHaveClass(/is-open/)
  })
})
