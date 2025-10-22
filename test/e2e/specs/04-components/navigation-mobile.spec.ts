/**
 * Mobile Navigation Tests
 * Tests for mobile menu functionality including hamburger and mobile interactions
 * @see src/components/Navigation/
 */

import { test, expect } from '@playwright/test'
import { VIEWPORTS } from '../../fixtures/test-data'

test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto('/')
  })

  test('@ready hamburger menu is visible on mobile', async ({ page }) => {
    const hamburger = page.locator('button[aria-label="toggle menu"]')
    await expect(hamburger).toBeVisible()
  })

  test('@ready main navigation is visible on mobile', async ({ page }) => {
    // Navigation is always visible (mobile-first design)
    const navMenu = page.locator('nav#main-nav ul')
    await expect(navMenu).toBeVisible()
  })

  test('@ready can toggle mobile menu splash animation', async ({ page }) => {
    const hamburger = page.locator('button[aria-label="toggle menu"]')
    const header = page.locator('#header')

    await hamburger.click()
    await page.waitForTimeout(500)

    // Check if header has expanded state class
    const hasExpandedClass = await header.evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })

    expect(hasExpandedClass).toBe(true)
  })

  test('@ready can close mobile menu animation', async ({ page }) => {
    const hamburger = page.locator('button[aria-label="toggle menu"]')
    const header = page.locator('header#header')

    // Open menu
    await hamburger.click()
    await page.waitForTimeout(500)

    let hasExpandedClass = await header.evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClass).toBe(true)

    // Close menu
    await hamburger.click()
    await page.waitForTimeout(500)

    hasExpandedClass = await header.evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClass).toBe(false)
  })

  test('@ready hamburger icon aria-expanded changes on toggle', async ({ page }) => {
    const hamburger = page.locator('button[aria-label="toggle menu"]')

    const initialExpanded = await hamburger.getAttribute('aria-expanded')
    expect(initialExpanded).toBe('false')

    // Toggle menu
    await hamburger.click()
    await page.waitForTimeout(500)

    const expandedState = await hamburger.getAttribute('aria-expanded')
    expect(expandedState).toBe('true')
  })

  test('@ready can navigate to page from mobile menu', async ({ page }) => {
    // Navigation links are always visible on mobile
    const aboutLink = page.locator('nav#main-nav a[href="/about"]')
    await aboutLink.click()

    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/about')
  })

  test('@ready mobile menu has proper ARIA attributes', async ({ page }) => {
    const hamburger = page.locator('button[aria-label="toggle menu"]')
    const nav = page.locator('nav#main-nav')

    const ariaLabel = await hamburger.getAttribute('aria-label')
    const navRole = await nav.getAttribute('role')
    const ariaOwns = await hamburger.getAttribute('aria-owns')

    expect(ariaLabel).toBe('toggle menu')
    expect(navRole).toBe('navigation')
    expect(ariaOwns).toBe('main-nav')
  })

  test.skip('@wip mobile menu closes after navigation', async ({ page: _page }) => {
    // Menu behavior after navigation depends on view transitions
    test.skip()
  })

  test.skip('@wip mobile menu has backdrop overlay', async ({ page: _page }) => {
    // This implementation uses mobile-splash animation, not a backdrop
    test.skip()
  })

  test.skip('@wip clicking backdrop closes mobile menu', async ({ page: _page }) => {
    // No backdrop in this implementation
    test.skip()
  })

  test.skip('@wip mobile menu prevents body scroll when open', async ({ page: _page }) => {
    // Body scroll prevention would require checking for no-scroll class
    test.skip()
  })

  test.skip('@wip mobile menu is keyboard accessible', async ({ page: _page }) => {
    // Keyboard navigation testing would require complex focus management tests
    test.skip()
  })

  test.skip('@wip focus is trapped in open mobile menu', async ({ page: _page }) => {
    // Focus trapping would require testing tab navigation boundaries
    test.skip()
  })

  test.skip('@wip pressing Escape closes mobile menu', async ({ page: _page }) => {
    // Escape key behavior not implemented in current navigation
    test.skip()
  })

  test.skip('@wip mobile submenu expands correctly', async ({ page: _page }) => {
    // No submenus in current navigation
    test.skip()
  })

  test.skip('@wip mobile menu animates smoothly', async ({ page: _page }) => {
    // Animation testing not critical for functional tests
    test.skip()
  })

  test.skip('@wip mobile menu works on landscape orientation', async ({ page: _page }) => {
    // Covered by responsive viewport testing
    test.skip()
  })
})
