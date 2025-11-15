/**
 * Theme Picker Component Tests
 * Comprehensive tests for theme switching functionality
 * @see src/components/ThemePicker/
 */
import {
  BasePage,
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
    test.beforeEach(async ({ page: playwrightPage }, testInfo) => {
      const page = new BasePage(playwrightPage)
      // Skip setup for tests that need custom media emulation
      if (testInfo.title.includes('prefers-color-scheme')) {
        return
      }
      await setupCleanTestPage(page.page)
    })

    test('@ready theme picker is visible', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      // Expected: Theme picker button should be visible in header
      const themePicker = getThemePickerToggle(page.page)
      await expect(themePicker).toBeVisible()
    })

    test('@ready can toggle to dark theme', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      // Expected: Clicking theme picker should open modal and allow selecting dark theme
      await selectTheme(page.page, 'dark')

      // Check if dark theme is applied
      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('dark')
    })

    test('@ready can toggle back to light theme', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      // Expected: Toggling twice should return to light theme

      // Toggle to dark
      await selectTheme(page.page, 'dark')

      // Toggle back to light
      await selectTheme(page.page, 'light')

      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('light')
    })

    test('@ready theme picker has accessible label', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      // Expected: Theme picker button should have appropriate ARIA label
      const themePicker = getThemePickerToggle(page.page)

      const ariaLabel = await themePicker.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel?.toLowerCase()).toContain('theme')
    })

    test('@ready theme picker shows current theme state', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      // Expected: Theme picker modal should show active state for current theme
      const themePicker = getThemePickerToggle(page.page)

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
    test.beforeEach(async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      await setupCleanTestPage(page.page)
    })

    test('@ready theme preference persists across page reloads', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      // Expected: Theme selection should be stored in localStorage

      // Toggle to dark theme
      await selectTheme(page.page, 'dark')

      // Reload page
      await page.reload()
      await page.waitForTimeout(300)

      // Verify dark theme persisted
      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('dark')
    })

    test('@ready theme preference persists across navigation', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      // Expected: Theme should persist when navigating between pages

      // This test needs its own setup without localStorage clearing
      await setupTestPage(page.page)

      // Select dark theme using helper
      await selectTheme(page.page, 'dark')

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
    test('@ready respects prefers-color-scheme on first visit', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      // Expected: Should use system preference if no stored preference

      // First, visit the page to establish the domain context
      await page.goto('/')

      // Clear localStorage to simulate first visit
      await page.evaluate(() => localStorage.clear())

      // Set up media emulation for dark color scheme
      await page.emulateMedia({ colorScheme: 'dark' })

      // Reload to apply the preference with no stored theme
      await page.reload({ waitUntil: 'domcontentloaded' })

      // Debug: Check what's in localStorage
      const storedTheme = await page.evaluate(() => localStorage.getItem('theme'))
      console.log('Stored theme after reload:', storedTheme)

      // Debug: Check media query
      const prefersDark = await page.evaluate(() =>
        window.matchMedia('(prefers-color-scheme: dark)').matches
      )
      console.log('Prefers dark:', prefersDark)

      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')
      console.log('Actual data-theme:', dataTheme)

      expect(dataTheme).toBe('dark')
    })

    test('@ready manual selection overrides system preference', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      // Expected: User selection should override system preference
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/')
      await page.waitForTimeout(300)

      // Manually switch to light theme
      await selectTheme(page.page, 'light')

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
    test.beforeEach(async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      // Clear localStorage and dismiss cookie modal before each test
      await setupTestPage(page.page, '/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
    })

    test('theme picker button works after View Transition navigation', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
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
      await navigateWithMobileSupport(page.page, '.main-nav-item a')

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

    test('theme picker can select themes after View Transition navigation', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      // Navigate to another page first using mobile-aware helper
      await navigateWithMobileSupport(page.page, '.main-nav-item a')

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

    test('theme preference persists across View Transitions', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      // 1. Select dark theme on home page
      const themeToggleBtn = page.locator('.theme-toggle-btn').first()
      await themeToggleBtn.click()

      const darkThemeBtn = page.locator('.themepicker__selectBtn[data-theme="dark"]').first()
      await darkThemeBtn.click()

      // Wait for theme to be applied and picker to close
      await page.waitForTimeout(500)

      // 2. Navigate to another page using mobile-aware helper
      await navigateWithMobileSupport(page.page, '.main-nav-item a')

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
    test.beforeEach(async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      await setupTestPage(page.page, '/')
      await page.evaluate(() => localStorage.clear())
      await page.reload()
    })

    test('preserves lang attribute across navigation', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
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

    test('preserves lang attribute with theme changes', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
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
