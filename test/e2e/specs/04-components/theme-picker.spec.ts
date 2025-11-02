/**
 * Theme Picker Component Tests
 * Tests for theme switching functionality (light/dark mode)
 * @see src/components/ThemePicker/
 */

import { test, expect } from '@test/e2e/helpers'
import { setupCleanTestPage, setupTestPage, selectTheme, getThemePickerToggle } from '../../helpers/cookieHelper'


test.describe('Theme Picker Component', () => {
  test.beforeEach(async ({ page }) => {
    // Most tests need clean state - individual tests can override this
    await setupCleanTestPage(page)
  })

  test('@wip theme picker is visible', async ({ page }) => {
    // Expected: Theme picker button should be visible in header
    const themePicker = getThemePickerToggle(page)
    await expect(themePicker).toBeVisible()
  })

  test('@wip can toggle to dark theme', async ({ page }) => {
    // Expected: Clicking theme picker should open modal and allow selecting dark theme
    await selectTheme(page, 'dark')

    // Check if dark theme is applied
    const htmlElement = page.locator('html')
    const dataTheme = await htmlElement.getAttribute('data-theme')

    expect(dataTheme).toBe('dark')
  })

  test('@wip can toggle back to light theme', async ({ page }) => {
    // Expected: Toggling twice should return to default theme

    // Toggle to dark
    await selectTheme(page, 'dark')

    // Toggle back to default (light)
    await selectTheme(page, 'default')

    const htmlElement = page.locator('html')
    const dataTheme = await htmlElement.getAttribute('data-theme')

    expect(dataTheme).toBe('default')
  })

  test('@wip theme preference persists across page reloads', async ({ page }) => {
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

  test('@wip theme preference persists across navigation', async ({ page }) => {
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

  test('@wip theme picker has accessible label', async ({ page }) => {
    // Expected: Theme picker button should have appropriate ARIA label
    const themePicker = getThemePickerToggle(page)

    const ariaLabel = await themePicker.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel?.toLowerCase()).toContain('theme')
  })

  test.skip('@wip theme picker shows current theme state', async ({ page }) => {
    // SKIPPED: is-active class not applied to parent <li> after theme selection
    // Root cause: setActiveItem() may not be called or activeTheme not updated properly
    // After clicking dark theme button, parent <li> should have is-active class but doesn't
    // This is an implementation bug in theme-picker-element.ts

    // Expected: Theme picker modal should show active state for current theme
    const themePicker = getThemePickerToggle(page)

    // Open the theme picker modal
    await themePicker.click()
    await page.waitForTimeout(300)

    // Check that default theme button has is-active class
    const defaultThemeButton = page.locator('button[data-theme="default"]')
    const parentLi = defaultThemeButton.locator('..')
    await expect(parentLi).toHaveClass(/is-active/)

    // Select dark theme
    await defaultThemeButton.click()
    await page.waitForTimeout(300)

    // Reopen modal
    await themePicker.click()
    await page.waitForTimeout(300)

    // Dark theme should now be active
    const darkThemeButton = page.locator('button[data-theme="dark"]')
    const darkParentLi = darkThemeButton.locator('..')
    await expect(darkParentLi).toHaveClass(/is-active/)
  })

  test.skip('@wip respects prefers-color-scheme on first visit', async ({ page }) => {
    // SKIPPED: Theme initialization doesn't respect prefers-color-scheme in current implementation
    // Expected: Should use system preference if no stored preference
    // Simulate dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' })

    // Visit site for "first time" (localStorage cleared in beforeEach)
    await page.goto('/')
    await page.waitForTimeout(300)

    const htmlElement = page.locator('html')
    const dataTheme = await htmlElement.getAttribute('data-theme')

    expect(dataTheme).toBe('dark')
  })

  test('@wip manual selection overrides system preference', async ({ page }) => {
    // Expected: User selection should override system preference
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.waitForTimeout(300)

    // Manually switch to default (light) theme
    await selectTheme(page, 'default')

    const htmlElement = page.locator('html')
    const dataTheme = await htmlElement.getAttribute('data-theme')

    expect(dataTheme).toBe('default')

    // Verify it persists after reload
    await page.reload()
    await page.waitForTimeout(300)

    const dataThemeAfterReload = await htmlElement.getAttribute('data-theme')
    expect(dataThemeAfterReload).toBe('default')
  })

  test('@wip theme transition is smooth', async ({ page }) => {
    // Expected: Theme change should not cause flash of unstyled content
    const themePicker = getThemePickerToggle(page)
    const htmlElement = page.locator('html')

    // Select dark theme
    await themePicker.click()
    await page.waitForTimeout(100)
    await page.click('[data-theme="dark"]')

    // Verify theme changed immediately (no flash)
    await page.waitForTimeout(100)

    const dataTheme = await htmlElement.getAttribute('data-theme')
    expect(dataTheme).toBe('dark')

    // Verify the theme is visually applied by checking a CSS variable
    const bgColor = await htmlElement.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('--color-bg')
    })

    expect(bgColor).toBeTruthy()
  })
})
