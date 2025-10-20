/**
 * Theme Picker Component Tests
 * Tests for theme switching functionality (light/dark mode)
 * @see src/components/ThemePicker/
 */

import { test, expect } from '@playwright/test'
import { TEST_URLS } from '../../fixtures/test-data'

test.describe('Theme Picker Component', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto(TEST_URLS.home)
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test.skip('@wip theme picker is visible', async ({ page }) => {
    // Expected: Theme picker button should be visible in header
    const themePicker = page.locator('[data-theme-picker]')
    await expect(themePicker).toBeVisible()
  })

  test.skip('@wip can toggle to dark theme', async ({ page }) => {
    // Expected: Clicking theme picker should toggle to dark theme
    const themePicker = page.locator('[data-theme-picker]')
    await themePicker.click()

    // Check if dark theme is applied
    const htmlElement = page.locator('html')
    const dataTheme = await htmlElement.getAttribute('data-theme')

    expect(dataTheme).toBe('dark')
  })

  test.skip('@wip can toggle back to light theme', async ({ page }) => {
    // Expected: Toggling twice should return to light theme
    const themePicker = page.locator('[data-theme-picker]')

    // Toggle to dark
    await themePicker.click()
    await page.waitForTimeout(300)

    // Toggle back to light
    await themePicker.click()
    await page.waitForTimeout(300)

    const htmlElement = page.locator('html')
    const dataTheme = await htmlElement.getAttribute('data-theme')

    expect(dataTheme).toBe('light')
  })

  test.skip('@wip theme preference persists across page reloads', async ({ page }) => {
    // Expected: Theme selection should be stored in localStorage
    const themePicker = page.locator('[data-theme-picker]')

    // Toggle to dark theme
    await themePicker.click()
    await page.waitForTimeout(300)

    // Reload page
    await page.reload()
    await page.waitForTimeout(300)

    // Verify dark theme persisted
    const htmlElement = page.locator('html')
    const dataTheme = await htmlElement.getAttribute('data-theme')

    expect(dataTheme).toBe('dark')
  })

  test.skip('@wip theme preference persists across navigation', async ({ page }) => {
    // Expected: Theme should persist when navigating between pages
    const themePicker = page.locator('[data-theme-picker]')

    // Toggle to dark theme
    await themePicker.click()
    await page.waitForTimeout(300)

    // Navigate to another page
    await page.goto(TEST_URLS.about)
    await page.waitForTimeout(300)

    // Verify dark theme persisted
    const htmlElement = page.locator('html')
    const dataTheme = await htmlElement.getAttribute('data-theme')

    expect(dataTheme).toBe('dark')
  })

  test.skip('@wip theme picker has accessible label', async ({ page }) => {
    // Expected: Theme picker button should have appropriate ARIA label
    const themePicker = page.locator('[data-theme-picker]')

    const ariaLabel = await themePicker.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel?.toLowerCase()).toContain('theme')
  })

  test.skip('@wip theme picker shows current theme state', async ({ page }) => {
    // Expected: Theme picker icon/text should reflect current theme
    const themePicker = page.locator('[data-theme-picker]')

    // Get initial state
    const initialContent = await themePicker.textContent()

    // Toggle theme
    await themePicker.click()
    await page.waitForTimeout(300)

    // Content should change to reflect new theme
    const newContent = await themePicker.textContent()
    expect(newContent).not.toBe(initialContent)
  })

  test.skip('@wip respects prefers-color-scheme on first visit', async ({ page }) => {
    // Expected: Should use system preference if no stored preference
    // Simulate dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' })

    // Visit site for "first time" (localStorage cleared in beforeEach)
    await page.goto(TEST_URLS.home)
    await page.waitForTimeout(300)

    const htmlElement = page.locator('html')
    const dataTheme = await htmlElement.getAttribute('data-theme')

    expect(dataTheme).toBe('dark')
  })

  test.skip('@wip manual selection overrides system preference', async ({ page }) => {
    // Expected: User selection should override system preference
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto(TEST_URLS.home)
    await page.waitForTimeout(300)

    // Manually switch to light theme
    const themePicker = page.locator('[data-theme-picker]')
    await themePicker.click()
    await page.waitForTimeout(300)

    const htmlElement = page.locator('html')
    const dataTheme = await htmlElement.getAttribute('data-theme')

    expect(dataTheme).toBe('light')

    // Verify it persists after reload
    await page.reload()
    await page.waitForTimeout(300)

    const dataThemeAfterReload = await htmlElement.getAttribute('data-theme')
    expect(dataThemeAfterReload).toBe('light')
  })

  test.skip('@wip theme transition is smooth', async ({ page }) => {
    // Expected: Theme change should have CSS transition
    const themePicker = page.locator('[data-theme-picker]')
    const htmlElement = page.locator('html')

    // Check for transition property
    const transitionDuration = await htmlElement.evaluate((el) => {
      return window.getComputedStyle(el).transitionDuration
    })

    expect(transitionDuration).not.toBe('0s')

    await themePicker.click()
    // Verify no flash of unstyled content
    await page.waitForTimeout(100)

    const dataTheme = await htmlElement.getAttribute('data-theme')
    expect(dataTheme).toBeTruthy()
  })
})
