/**
 * Theme Picker Component Tests
 * Comprehensive tests for theme switching functionality
 * @see src/components/ThemePicker/
 */
import {
  expect,
  getThemePickerToggle,
  selectTheme,
  setupCleanTestPage,
  setupTestPage,
  test,
} from '@test/e2e/helpers'

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

test.describe('Theme Picker Component', () => {
  test.describe('Core Functionality', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      // Skip setup for tests that need custom media emulation
      if (testInfo.title.includes('prefers-color-scheme')) {
        return
      }
      await setupCleanTestPage(page)
    })

    test('@ready theme picker is visible', async ({ page }) => {
      // Expected: Theme picker button should be visible in header
      const themePicker = getThemePickerToggle(page)
      await expect(themePicker).toBeVisible()
    })

    test('@ready can toggle to dark theme', async ({ page }) => {
      // Expected: Clicking theme picker should open modal and allow selecting dark theme
      await selectTheme(page, 'dark')

      // Check if dark theme is applied
      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('dark')
    })

    test('@ready can toggle back to light theme', async ({ page }) => {
      // Expected: Toggling twice should return to light theme

      // Toggle to dark
      await selectTheme(page, 'dark')

      // Toggle back to light
      await selectTheme(page, 'light')

      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('light')
    })

    test('@ready theme picker has accessible label', async ({ page }) => {
      // Expected: Theme picker button should have appropriate ARIA label
      const themePicker = getThemePickerToggle(page)

      const ariaLabel = await themePicker.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel?.toLowerCase()).toContain('theme')
    })

    test('@ready theme picker shows current theme state', async ({ page }) => {
      // Expected: Theme picker modal should show active state for current theme
      const themePicker = getThemePickerToggle(page)

      // Open the theme picker modal
      await themePicker.click()
      await page.waitForTimeout(300)

      // Check that light theme button's parent has is-active class
      const lightThemeButton = page.locator('button[data-theme="light"]')
      const lightParentLi = lightThemeButton.locator('..')

      // Verify light theme is initially active
      const lightClasses = await lightParentLi.getAttribute('class')
      expect(lightClasses).toContain('is-active')

      // Select dark theme (which closes the modal)
      const darkThemeButton = page.locator('button[data-theme="dark"]')
      await darkThemeButton.click()
      await page.waitForTimeout(300)

      // Reopen modal
      await themePicker.click()
      await page.waitForTimeout(300)

      // Dark theme should now be active
      const darkParentLi = darkThemeButton.locator('..')
      const darkClasses = await darkParentLi.getAttribute('class')
      expect(darkClasses).toContain('is-active')

      // And light should no longer be active
      const lightClassesAfter = await lightParentLi.getAttribute('class')
      expect(lightClassesAfter).not.toContain('is-active')
    })
  })

  test.describe('Persistence', () => {
    test.beforeEach(async ({ page }) => {
      await setupCleanTestPage(page)
    })

    test('@ready theme preference persists across page reloads', async ({ page }) => {
      // Expected: Theme selection should be stored in localStorage

      // Toggle to dark theme
      await selectTheme(page, 'dark')

      // Reload page
      await page.reload()
      await page.waitForTimeout(300)

      // Verify dark theme persisted
      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('dark')
    })

    test('@ready theme preference persists across navigation', async ({ page }) => {
      // Expected: Theme should persist when navigating between pages

      // This test needs its own setup without localStorage clearing
      await setupTestPage(page)

      // Select dark theme using helper
      await selectTheme(page, 'dark')

      // Navigate to another page
      await page.goto('/about')
      await page.waitForTimeout(300)

      // Verify dark theme persisted
      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('dark')
    })
  })

  test.describe('System Preferences', () => {
    test('@ready respects prefers-color-scheme on first visit', async ({ page }) => {
      // Expected: Should use system preference if no stored preference
      // Simulate dark mode preference BEFORE navigation
      await page.context().clearCookies()

      await page.emulateMedia({ colorScheme: 'dark' })

      // Visit site for "first time" with dark mode preference
      await page.goto('/', { waitUntil: 'domcontentloaded' })

      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('dark')
    })

    test('@ready manual selection overrides system preference', async ({ page }) => {
      // Expected: User selection should override system preference
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/')
      await page.waitForTimeout(300)

      // Manually switch to light theme
      await selectTheme(page, 'light')

      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('light')

      // Verify it persists after reload
      await page.reload()
      await page.waitForTimeout(300)

      const dataThemeAfterReload = await htmlElement.getAttribute('data-theme')
      expect(dataThemeAfterReload).toBe('light')
    })
  })

  test.describe('View Transitions - Regression', () => {
    test.beforeEach(async ({ page }) => {
      // Clear localStorage and dismiss cookie modal before each test
      await setupTestPage(page, '/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
    })

    test('theme picker button works after View Transition navigation', async ({ page }) => {
      // Issue: Theme picker button stopped working after navigating to another page
      // Root Cause: Scripts didn't properly reinitialize on View Transitions
      // Fix: Migrated to Web Component pattern with connectedCallback/disconnectedCallback lifecycle

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

  test.describe('HTML Attributes - Regression', () => {
    test.beforeEach(async ({ page }) => {
      await setupTestPage(page, '/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
    })

    test('preserves lang attribute across navigation', async ({ page }) => {
      // Bug: Astro View Transitions removes lang attribute from <html>
      // Verify lang attribute on home page
      let langAttr = await page.getAttribute('html', 'lang')
      expect(langAttr).toBe('en')

      // Navigate to another page using View Transitions
      await page.goto('/about')

      // Verify lang attribute is still present (not removed by View Transitions)
      langAttr = await page.getAttribute('html', 'lang')
      expect(langAttr).toBe('en')
    })

    test('preserves lang attribute with theme changes', async ({ page }) => {
      // Set theme
      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark')
      })

      await page.reload()

      // Verify both attributes are present
      const langAttr = await page.getAttribute('html', 'lang')
      const themeAttr = await page.getAttribute('html', 'data-theme')

      expect(langAttr).toBe('en')
      expect(themeAttr).toBe('dark')

      // Navigate and verify both persist
      await page.goto('/articles')

      const langAttrAfter = await page.getAttribute('html', 'lang')
      const themeAttrAfter = await page.getAttribute('html', 'data-theme')

      expect(langAttrAfter).toBe('en')
      expect(themeAttrAfter).toBe('dark')
    })
  })
})
