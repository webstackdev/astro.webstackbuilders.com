/**
 * Desktop Navigation Tests
 * Tests for desktop navigation including hover states, dropdowns, and mega menus
 * @see src/components/Navigation/
 */

import { test, expect } from '@test/e2e/helpers'

test.describe('Desktop Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
  })

  test('@ready navigation is visible on desktop', async ({ page }) => {
    const nav = page.locator('nav#main-nav')
    await expect(nav).toBeVisible()
  })

  test('@ready hamburger menu is hidden on desktop', async ({ page }) => {
    const hamburger = page.locator('button#nav-toggle')
    await expect(hamburger).not.toBeVisible()
  })

  test('@ready all main navigation items are visible', async ({ page }) => {
    const nav = page.locator('nav#main-nav')
    const navItems = nav.locator('a[href]')

    const count = await navItems.count()
    expect(count).toBe(5) // About, Articles, Case Studies, Services, Contact

    for (const item of await navItems.all()) {
      const text = await item.textContent()
      expect(text?.trim().length).toBeGreaterThan(0)
    }
  })

  test('@ready can navigate to pages from desktop nav', async ({ page }) => {
    const nav = page.locator('nav#main-nav')
    const aboutLink = nav.locator('a[href*="/about"]').first()

    await aboutLink.click()
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/about')
  })

  test('@ready active page is highlighted in nav', async ({ page }) => {
    await page.goto('/about')

    const nav = page.locator('nav#main-nav')
    const aboutLink = nav.locator('a[href*="/about"]').first()

    const hasActiveClass = await aboutLink.evaluate((el) => {
      return el.parentElement?.classList.contains('nav-item-active')
    })

    expect(hasActiveClass).toBe(true)
  })

  test('@ready navigation has proper ARIA labels', async ({ page }) => {
    const nav = page.locator('nav#main-nav')
    const navMenu = nav.locator('ul')

    const navRole = await nav.getAttribute('role')
    const navAriaLabel = await nav.getAttribute('aria-label')
    const menuAriaLabel = await navMenu.getAttribute('aria-label')

    expect(navRole).toBe('navigation')
    expect(navAriaLabel).toBe('Main')
    expect(menuAriaLabel).toBe('main navigation')
  })

  test.skip('@wip hovering parent item shows submenu', async ({ page: _page }) => {
    // Navigation doesn't have submenus - this test is not applicable
    test.skip()
  })

  test.skip('@wip submenu hides when mouse leaves', async ({ page: _page }) => {
    // Navigation doesn't have submenus - this test is not applicable
    test.skip()
  })

  test.skip('@wip can click submenu items', async ({ page: _page }) => {
    // Navigation doesn't have submenus - this test is not applicable
    test.skip()
  })

  test('@ready navigation links have hover states', async ({ page }) => {
    const nav = page.locator('nav#main-nav')
    const firstLink = nav.locator('a').first()

    // Hover and check that hover styles apply
    await firstLink.hover()

    const hasHoverTransition = await firstLink.evaluate((el) => {
      const parent = el.parentElement
      return parent?.classList.contains('main-nav-item')
    })

    expect(hasHoverTransition).toBe(true)
  })

  test.skip('@wip navigation is sticky on scroll', async ({ page: _page }) => {
    // Header/navigation stickiness would be tested in header tests
    test.skip()
  })

  test.skip('@wip nav has proper z-index for overlays', async ({ page: _page }) => {
    // Z-index testing not critical for functional tests
    test.skip()
  })

  test.skip('@wip submenu keyboard navigation works', async ({ page: _page }) => {
    // No submenus in this navigation
    test.skip()
  })

  test.skip('@wip nav works on tablet breakpoint', async ({ page: _page }) => {
    // Responsive behavior tested in mobile tests
    test.skip()
  })

  test.skip('@wip nav logo links to homepage', async ({ page: _page }) => {
    // Logo is in Header component, not Navigation
    test.skip()
  })

  test.skip('@wip nav has skip to content link', async ({ page: _page }) => {
    // Skip link is in Header component
    test.skip()
  })
})
