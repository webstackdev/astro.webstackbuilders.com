/**
 * Mobile Navigation Tests
 * Tests for mobile menu functionality including hamburger, drawer, and touch interactions
 * @see src/components/Navigation/
 */

import { test, expect } from '@playwright/test'
import { TEST_URLS, VIEWPORTS } from '../../fixtures/test-data'

test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto(TEST_URLS.home)
  })

  test.skip('@wip hamburger menu is visible on mobile', async ({ page }) => {
    // Expected: Hamburger button should be visible on mobile viewport
    const hamburger = page.locator('[data-nav-toggle]')
    await expect(hamburger).toBeVisible()
  })

  test.skip('@wip main navigation is hidden by default on mobile', async ({ page }) => {
    // Expected: Nav menu should be hidden until hamburger is clicked
    const navMenu = page.locator('[data-nav-menu]')
    await expect(navMenu).not.toBeVisible()
  })

  test.skip('@wip can open mobile menu', async ({ page }) => {
    // Expected: Clicking hamburger should open menu
    const hamburger = page.locator('[data-nav-toggle]')
    const navMenu = page.locator('[data-nav-menu]')

    await hamburger.click()
    await page.waitForTimeout(300)

    await expect(navMenu).toBeVisible()
  })

  test.skip('@wip can close mobile menu', async ({ page }) => {
    // Expected: Clicking hamburger again should close menu
    const hamburger = page.locator('[data-nav-toggle]')
    const navMenu = page.locator('[data-nav-menu]')

    // Open menu
    await hamburger.click()
    await page.waitForTimeout(300)
    await expect(navMenu).toBeVisible()

    // Close menu
    await hamburger.click()
    await page.waitForTimeout(300)
    await expect(navMenu).not.toBeVisible()
  })

  test.skip('@wip hamburger icon changes when menu is open', async ({ page }) => {
    // Expected: Hamburger icon should transform to X when menu is open
    const hamburger = page.locator('[data-nav-toggle]')

    // Get initial aria-label or aria-expanded
    const initialExpanded = await hamburger.getAttribute('aria-expanded')
    expect(initialExpanded).toBe('false')

    // Open menu
    await hamburger.click()
    await page.waitForTimeout(300)

    const expandedState = await hamburger.getAttribute('aria-expanded')
    expect(expandedState).toBe('true')
  })

  test.skip('@wip can navigate to page from mobile menu', async ({ page }) => {
    // Expected: Clicking a link in mobile menu should navigate
    const hamburger = page.locator('[data-nav-toggle]')
    const navMenu = page.locator('[data-nav-menu]')

    await hamburger.click()
    await page.waitForTimeout(300)

    // Click About link
    const aboutLink = navMenu.locator('a[href*="/about"]')
    await aboutLink.click()

    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/about')
  })

  test.skip('@wip mobile menu closes after navigation', async ({ page }) => {
    // Expected: Menu should close after clicking a link
    const hamburger = page.locator('[data-nav-toggle]')
    const navMenu = page.locator('[data-nav-menu]')

    await hamburger.click()
    await page.waitForTimeout(300)

    const servicesLink = navMenu.locator('a[href*="/services"]')
    await servicesLink.click()

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(300)

    // Menu should be closed
    await expect(navMenu).not.toBeVisible()
  })

  test.skip('@wip mobile menu has backdrop overlay', async ({ page }) => {
    // Expected: Opening menu should show backdrop overlay
    const hamburger = page.locator('[data-nav-toggle]')
    const backdrop = page.locator('[data-nav-backdrop]')

    await hamburger.click()
    await page.waitForTimeout(300)

    await expect(backdrop).toBeVisible()
  })

  test.skip('@wip clicking backdrop closes mobile menu', async ({ page }) => {
    // Expected: Clicking outside menu should close it
    const hamburger = page.locator('[data-nav-toggle]')
    const navMenu = page.locator('[data-nav-menu]')
    const backdrop = page.locator('[data-nav-backdrop]')

    await hamburger.click()
    await page.waitForTimeout(300)
    await expect(navMenu).toBeVisible()

    await backdrop.click()
    await page.waitForTimeout(300)

    await expect(navMenu).not.toBeVisible()
  })

  test.skip('@wip mobile menu prevents body scroll when open', async ({ page }) => {
    // Expected: Body should not scroll when mobile menu is open
    const hamburger = page.locator('[data-nav-toggle]')

    const initialOverflow = await page.evaluate(() => {
      return window.getComputedStyle(document.body).overflow
    })

    await hamburger.click()
    await page.waitForTimeout(300)

    const menuOpenOverflow = await page.evaluate(() => {
      return window.getComputedStyle(document.body).overflow
    })

    expect(menuOpenOverflow).toBe('hidden')
    expect(menuOpenOverflow).not.toBe(initialOverflow)
  })

  test.skip('@wip mobile menu is keyboard accessible', async ({ page }) => {
    // Expected: Should be able to navigate menu with keyboard

    // Tab to hamburger button
    await page.keyboard.press('Tab')

    // Open menu with Enter
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    const navMenu = page.locator('[data-nav-menu]')
    await expect(navMenu).toBeVisible()

    // Should be able to tab through menu items
    await page.keyboard.press('Tab')
    const firstLink = await page.evaluate(() => {
      return document.activeElement?.tagName === 'A'
    })

    expect(firstLink).toBe(true)
  })

  test.skip('@wip pressing Escape closes mobile menu', async ({ page }) => {
    // Expected: Escape key should close the menu
    const hamburger = page.locator('[data-nav-toggle]')
    const navMenu = page.locator('[data-nav-menu]')

    await hamburger.click()
    await page.waitForTimeout(300)
    await expect(navMenu).toBeVisible()

    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    await expect(navMenu).not.toBeVisible()
  })

  test.skip('@wip mobile submenu expands correctly', async ({ page }) => {
    // Expected: Tapping parent item should expand submenu
    const hamburger = page.locator('[data-nav-toggle]')
    const navMenu = page.locator('[data-nav-menu]')

    await hamburger.click()
    await page.waitForTimeout(300)

    // Find a menu item with submenu (e.g., Services)
    const servicesParent = navMenu.locator('[data-submenu-trigger]').first()
    await servicesParent.click()
    await page.waitForTimeout(300)

    // Submenu should be visible
    const submenu = page.locator('[data-submenu]').first()
    await expect(submenu).toBeVisible()
  })

  test.skip('@wip mobile menu animates smoothly', async ({ page }) => {
    // Expected: Menu should slide in from side with animation
    const hamburger = page.locator('[data-nav-toggle]')
    const navMenu = page.locator('[data-nav-menu]')

    await hamburger.click()

    // Check for transition or animation
    const hasTransition = await navMenu.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.transition !== 'all 0s ease 0s' || styles.animation !== 'none 0s ease 0s'
    })

    expect(hasTransition).toBe(true)
  })

  test.skip('@wip mobile menu works on landscape orientation', async ({ page }) => {
    // Expected: Menu should work on landscape mobile devices
    await page.setViewportSize({ width: 667, height: 375 })
    await page.goto(TEST_URLS.home)

    const hamburger = page.locator('[data-nav-toggle]')
    await hamburger.click()
    await page.waitForTimeout(300)

    const navMenu = page.locator('[data-nav-menu]')
    await expect(navMenu).toBeVisible()
  })
})
