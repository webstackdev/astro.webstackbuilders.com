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
import { wait } from '@test/e2e/helpers/waitTimeouts'

const getDefaultNavigationHref = (basePage: BasePage) => basePage.navigationItems[0]?.url ?? '/about'

/**
 * Helper function to handle mobile navigation
 */
async function navigateWithMobileSupport(basePage: BasePage, href: string = getDefaultNavigationHref(basePage)) {
  const page = basePage.page
  const viewport = page.viewportSize()
  const isMobile = viewport && viewport.width < 768
  const navToggle = page.locator('button#nav-toggle')
  const header = page.locator('#header')

  if (isMobile) {
    // Open mobile menu first
    await navToggle.waitFor({ state: 'visible' })
    await navToggle.click()
    await expect(navToggle).toHaveAttribute('aria-expanded', 'true')
    await expect(header).toHaveClass(/aria-expanded-true/)
  }

  // Trigger client-side navigation (Astro View Transitions)
  await basePage.navigateToPage(href)
  await basePage.waitForPageLoad({ requireNext: true, timeout: wait.navigation })
  // Header components rehydrate asynchronously after View Transitions; make sure
  // the theme picker + navigation are ready before interacting again.
  await basePage.waitForHeaderComponents()

  // On mobile, the menu should automatically close after navigation
  // But let's ensure it's closed by checking and closing if needed
  if (isMobile) {
    const isExpanded = await navToggle.getAttribute('aria-expanded')
    if (isExpanded === 'true') {
      await navToggle.click()
      await expect(navToggle).toHaveAttribute('aria-expanded', 'false')
      await expect(header).not.toHaveClass(/aria-expanded-true/)
    }
  }
}

test.describe('Theme Picker Component', () => {
  test.describe('Core Functionality', () => {
    /**
     * Clean test setup before each test
     *
     * Side effects relied upon:
     * - Clears all cookies, localStorage, and sessionStorage to prevent state pollution between tests
     * - Performs hard reload to bypass View Transitions cache
     * - Dismisses cookie consent modal so it doesn't interfere with theme picker interactions
     * - Ensures consistent starting state for theme testing (no persisted theme preferences)
     * Without this setup, tests would fail due to:
     * - Leftover theme preferences from previous tests affecting assertions
     * - Cookie modal blocking theme picker UI interactions
     * - Stale View Transitions state causing inconsistent behavior
     */
    test.beforeEach(async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
      await setupCleanTestPage(page.page, '/', { reloadStrategy: 'cacheBustingGoto' })
      await page.waitForHeaderComponents({ timeout: wait.navigation })
    })

    test('@ready theme picker is visible', async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
      // Expected: Theme picker button should be visible in header
      const themePicker = getThemePickerToggle(page.page)
      await expect(themePicker).toBeVisible()
    })

    test('@ready can toggle to dark theme', async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
      // Expected: Clicking theme picker should open modal and allow selecting dark theme
      await selectTheme(page.page, 'dark')

      // Check if dark theme is applied
      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('dark')
    })

    test('@ready can toggle back to light theme', async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
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
      const page = await BasePage.init(playwrightPage)
      // Expected: Theme picker button should have appropriate ARIA label
      const themePicker = getThemePickerToggle(page.page)

      const ariaLabel = await themePicker.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel?.toLowerCase()).toContain('theme')
    })

    test('@ready theme picker shows current theme state', async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
      // Expected: Theme picker modal should show active state for current theme
      const themePicker = getThemePickerToggle(page.page)
      const modal = page.locator('[data-theme-modal]')
      const closeBtn = page.locator('.themepicker__closeBtn').first()

      // Open the theme picker modal
      await themePicker.click()
      await expect(themePicker).toHaveAttribute('aria-expanded', 'true')
      await expect(modal).toHaveClass(/is-open/)

      // Check that light theme button's parent has is-active class
      const lightThemeButton = page.locator('button[data-theme="light"]')
      const lightParentLi = lightThemeButton.locator('..')

      // Verify light theme is initially active
      await expect(lightParentLi).toHaveClass(/is-active/)

      // Select dark theme - modal stays open for additional actions
      const darkThemeButton = page.locator('button[data-theme="dark"]')
      await darkThemeButton.click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

      // Close the modal using the dedicated close button
      await closeBtn.click()
      await expect(themePicker).toHaveAttribute('aria-expanded', 'false')
      await expect(modal).not.toHaveClass(/is-open/)

      // Reopen modal
      await themePicker.click()
      await expect(themePicker).toHaveAttribute('aria-expanded', 'true')
      await expect(modal).toHaveClass(/is-open/)

      // Dark theme should now be active
      const darkParentLi = darkThemeButton.locator('..')
      await expect(darkParentLi).toHaveClass(/is-active/)

      // And light should no longer be active
      await expect(lightParentLi).not.toHaveClass(/is-active/)
    })
  })

  test.describe('Persistence', () => {
    /**
     * Clean test setup before each persistence test
     *
     * Side effects relied upon:
     * - Clears all storage and cookies to start with no persisted theme preference
     * - Dismisses cookie modal to prevent UI interference
     * - Ensures clean state needed to properly test theme persistence behavior
     *
      await page.waitForHeaderComponents()
     * - Pre-existing theme preferences making it impossible to verify persistence from scratch
     * - Cached state from previous tests affecting reload behavior
     */
    test.beforeEach(async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
      await setupCleanTestPage(page.page, '/', { reloadStrategy: 'cacheBustingGoto' })
      await page.waitForHeaderComponents()
    })

    test('@ready theme preference persists across page reloads', async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
      // Expected: Theme selection should be stored in localStorage

      // Toggle to dark theme
      await selectTheme(page.page, 'dark')

      // Reload page
      await page.reload({ waitUntil: 'domcontentloaded', timeout: wait.slowNavigation })
      await page.waitForHeaderComponents({ timeout: wait.navigation })

      // Verify dark theme persisted
      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('dark')
    })

    test('@ready theme preference persists across navigation', async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
      // Expected: Theme should persist when navigating between pages

      // This test needs its own setup without localStorage clearing
      await setupTestPage(page.page)
      await page.waitForHeaderComponents()

      // Select dark theme using helper
      await selectTheme(page.page, 'dark')

      // Navigate to another page
      await page.goto('/about')
      // NOTE: Avoid strict 'networkidle' gating on WebKit/mobile-safari (can hang on long-lived requests).
      await page.waitForNetworkIdleBestEffort()

      // Verify dark theme persisted
      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('dark')
    })
  })

  test.describe('System Preferences', () => {
    test('@ready respects prefers-color-scheme on first visit', async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
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

      // Debug: Check media query
      const prefersDark = await page.evaluate(() =>
        window.matchMedia('(prefers-color-scheme: dark)').matches
      )

      expect(prefersDark).toBe(true)
      expect(storedTheme).toBe('dark')

      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('dark')
    })

    test('@ready manual selection overrides system preference', async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
      // Expected: User selection should override system preference
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await page.waitForHeaderComponents({ timeout: wait.navigation })

      // Manually switch to light theme
      await selectTheme(page.page, 'light')

      const htmlElement = page.locator('html')
      const dataTheme = await htmlElement.getAttribute('data-theme')

      expect(dataTheme).toBe('light')

      // Verify it persists after reload
      const cacheBust = `/?_cb=${Date.now()}`
      await page.goto(cacheBust, { waitUntil: 'domcontentloaded', timeout: wait.bespokeCacheBustNavigation })
      await page.waitForHeaderComponents({ timeout: wait.heavyNavigation })

      const dataThemeAfterReload = await htmlElement.getAttribute('data-theme')
      expect(dataThemeAfterReload).toBe('light')
    })
  })

  test.describe('View Transitions - Regression', () => {
    /**
     * Setup for View Transitions regression tests
     *
     * Side effects relied upon:
     * - Navigates to homepage and dismisses cookie modal
     * - Clears localStorage to remove any persisted theme
     * - Performs reload to ensure View Transitions cache is fresh
     *
     * Without this setup, View Transitions tests would fail due to:
     * - Stale View Transitions state from previous navigations
     * - Persisted theme preferences interfering with navigation behavior
     * - Cookie modal blocking interactions during navigation
     *
     * Critical for testing that theme picker properly reinitializes after View Transitions navigation
     */
    test.beforeEach(async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
      // Clear localStorage and dismiss cookie modal before each test
      await setupTestPage(page.page, '/')
      await page.evaluate(() => localStorage.clear())
      await page.waitForHeaderComponents({ timeout: wait.navigation })
    })

    test('theme picker button works after View Transition navigation', async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
      // Issue: Theme picker button stopped working after navigating to another page
      // Root Cause: Scripts didn't properly reinitialize on View Transitions
      // Fix: Migrated to Web Component pattern with connectedCallback/disconnectedCallback lifecycle

      await page.waitForHeaderComponents()
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
      await navigateWithMobileSupport(page)

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
      const page = await BasePage.init(playwrightPage)
      // Navigate to another page first using mobile-aware helper
      await navigateWithMobileSupport(page)

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
      const page = await BasePage.init(playwrightPage)
      // 1. Select dark theme on home page
      const themeToggleBtn = page.locator('.theme-toggle-btn').first()
      await themeToggleBtn.click()

      const darkThemeBtn = page.locator('.themepicker__selectBtn[data-theme="dark"]').first()
      await darkThemeBtn.click()

      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

      // 2. Navigate to another page using mobile-aware helper
      await navigateWithMobileSupport(page)

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
    /**
     * Setup for HTML attributes regression tests
     *
     * Side effects relied upon:
     * - Navigates to homepage and dismisses cookie modal
     * - Clears localStorage to ensure no theme is persisted
     * - Reloads page to get fresh HTML with all attributes intact
     *
     * Without this setup, tests would fail due to:
     * - Modified HTML state from previous tests
     * - Astro View Transitions potentially caching incorrect HTML state
     * - Cookie modal interfering with navigation and attribute testing
     *
     * Critical for verifying that HTML attributes (like lang) survive View Transitions navigation
     */
    test.beforeEach(async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
      await setupTestPage(page.page, '/')
      await page.evaluate(() => localStorage.clear())
      await page.waitForHeaderComponents({ timeout: wait.navigation })
    })

    test('preserves lang attribute across navigation', async ({ page: playwrightPage }) => {
      const page = await BasePage.init(playwrightPage)
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
      const page = await BasePage.init(playwrightPage)
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
      await page.navigateToPage('/articles')
      await page.waitForHeaderComponents({ timeout: wait.navigation })

      const langAttrAfter = await page.getAttribute('html', 'lang')
      const themeAttrAfter = await page.getAttribute('html', 'data-theme')

      expect(langAttrAfter).toBe('en')
      expect(themeAttrAfter).toBe('dark')
    })
  })
})
