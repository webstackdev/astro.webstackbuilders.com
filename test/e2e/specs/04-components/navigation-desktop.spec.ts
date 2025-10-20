/**
 * Desktop Navigation Tests
 * Tests for desktop navigation including hover states, dropdowns, and mega menus
 * @see src/components/Navigation/
 */

import { test, expect } from '@playwright/test'
import { TEST_URLS, VIEWPORTS } from '../../fixtures/test-data'

test.describe('Desktop Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto(TEST_URLS.home)
  })

  test.skip('@wip navigation is visible on desktop', async ({ page }) => {
    // Expected: Main navigation should be visible on desktop viewport
    const nav = page.locator('nav[data-nav-desktop]')
    await expect(nav).toBeVisible()
  })

  test.skip('@wip hamburger menu is hidden on desktop', async ({ page }) => {
    // Expected: Mobile hamburger should not be visible on desktop
    const hamburger = page.locator('[data-nav-toggle]')
    await expect(hamburger).not.toBeVisible()
  })

  test.skip('@wip all main navigation items are visible', async ({ page }) => {
    // Expected: All primary nav links should be visible
    const nav = page.locator('nav[data-nav-desktop]')
    const navItems = nav.locator('a[href]')

    const count = await navItems.count()
    expect(count).toBeGreaterThan(0)

    // Verify structure is reasonable
    for (const item of await navItems.all()) {
      const text = await item.textContent()
      expect(text?.trim().length).toBeGreaterThan(0)
    }
  })

  test.skip('@wip can navigate to pages from desktop nav', async ({ page }) => {
    // Expected: Clicking nav links should navigate to pages
    const nav = page.locator('nav[data-nav-desktop]')
    const aboutLink = nav.locator('a[href*="/about"]').first()

    await aboutLink.click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/about')
  })

  test.skip('@wip hovering parent item shows submenu', async ({ page }) => {
    // Expected: Hovering over Services should show submenu
    const nav = page.locator('nav[data-nav-desktop]')
    const servicesLink = nav.locator('[data-submenu-trigger]').first()

    await servicesLink.hover()
    await page.waitForTimeout(300)

    const submenu = page.locator('[data-submenu]').first()
    await expect(submenu).toBeVisible()
  })

  test.skip('@wip submenu hides when mouse leaves', async ({ page }) => {
    // Expected: Moving mouse away should hide submenu
    const nav = page.locator('nav[data-nav-desktop]')
    const servicesLink = nav.locator('[data-submenu-trigger]').first()
    const submenu = page.locator('[data-submenu]').first()

    // Show submenu
    await servicesLink.hover()
    await page.waitForTimeout(300)
    await expect(submenu).toBeVisible()

    // Move mouse away
    await page.mouse.move(0, 0)
    await page.waitForTimeout(500)

    await expect(submenu).not.toBeVisible()
  })

  test.skip('@wip can click submenu items', async ({ page }) => {
    // Expected: Should be able to navigate via submenu
    const nav = page.locator('nav[data-nav-desktop]')
    const servicesLink = nav.locator('[data-submenu-trigger]').first()

    await servicesLink.hover()
    await page.waitForTimeout(300)

    const submenu = page.locator('[data-submenu]').first()
    const firstSubmenuItem = submenu.locator('a').first()

    await firstSubmenuItem.click()
    await page.waitForLoadState('networkidle')

    // Should have navigated
    expect(page.url()).not.toBe(TEST_URLS.home)
  })

  test.skip('@wip active page is highlighted in nav', async ({ page }) => {
    // Expected: Current page link should have active state
    await page.goto(TEST_URLS.about)

    const nav = page.locator('nav[data-nav-desktop]')
    const aboutLink = nav.locator('a[href*="/about"]').first()

    // Check for active class or aria-current
    const ariaCurrent = await aboutLink.getAttribute('aria-current')
    const hasActiveClass = await aboutLink.evaluate((el) => {
      return el.classList.contains('active') || el.classList.contains('current')
    })

    expect(ariaCurrent === 'page' || hasActiveClass).toBe(true)
  })

  test.skip('@wip navigation is sticky on scroll', async ({ page }) => {
    // Expected: Nav should stick to top when scrolling down
    const nav = page.locator('nav')

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(300)

    // Check if nav is still visible and has fixed/sticky position
    await expect(nav).toBeVisible()

    const position = await nav.evaluate((el) => {
      return window.getComputedStyle(el).position
    })

    expect(['fixed', 'sticky']).toContain(position)
  })

  test.skip('@wip nav has proper z-index for overlays', async ({ page }) => {
    // Expected: Nav should appear above page content
    const nav = page.locator('nav')

    const zIndex = await nav.evaluate((el) => {
      return parseInt(window.getComputedStyle(el).zIndex || '0')
    })

    expect(zIndex).toBeGreaterThan(0)
  })

  test.skip('@wip submenu keyboard navigation works', async ({ page }) => {
    // Expected: Can navigate submenu with keyboard

    // Tab to services link
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab') // May need multiple tabs

    // Press Enter to open submenu
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    const submenu = page.locator('[data-submenu]').first()
    await expect(submenu).toBeVisible()

    // Arrow down to submenu item
    await page.keyboard.press('ArrowDown')

    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName
    })

    expect(focusedElement).toBe('A')
  })

  test.skip('@wip nav works on tablet breakpoint', async ({ page }) => {
    // Expected: Nav should adapt appropriately for tablet
    await page.setViewportSize(VIEWPORTS.tablet)
    await page.goto(TEST_URLS.home)

    const nav = page.locator('nav')
    await expect(nav).toBeVisible()

    // Check if desktop or mobile nav is shown
    const isDesktopNav = await page.locator('nav[data-nav-desktop]').isVisible()
    const isMobileNav = await page.locator('[data-nav-toggle]').isVisible()

    // One should be visible
    expect(isDesktopNav || isMobileNav).toBe(true)
  })

  test.skip('@wip nav logo links to homepage', async ({ page }) => {
    // Expected: Clicking logo should return to home
    await page.goto(TEST_URLS.about)

    const logo = page.locator('nav a[href="/"]').first()
    await logo.click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).toBe(TEST_URLS.home)
  })

  test.skip('@wip nav has skip to content link', async ({ page }) => {
    // Expected: Should have accessible skip link
    await page.goto(TEST_URLS.home)

    // Tab to first element (should be skip link)
    await page.keyboard.press('Tab')

    const skipLink = page.locator('a[href="#main-content"]')
    const isVisible = await skipLink.isVisible()

    // Skip link may be visually hidden until focused
    expect(isVisible).toBe(true)
  })
})
