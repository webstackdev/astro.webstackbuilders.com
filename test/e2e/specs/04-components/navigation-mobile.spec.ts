/**
 * Mobile Navigation Tests
 * Tests for mobile menu functionality including hamburger and mobile interactions
 * @see src/components/Navigation/
 */

import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Mobile Navigation', () => {
  test('@ready hamburger menu is visible on mobile', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')
    await page.expectElementVisible('button[aria-label="toggle menu"]')
  })

  test('@ready main navigation is visible on mobile', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')
    // Navigation is always visible (mobile-first design)
    await page.expectElementVisible('nav#main-nav ul')
  })

  test('@ready can toggle mobile menu splash animation', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')

    await page.click('button[aria-label="toggle menu"]')
    await page.wait(500)

    // Check if header has expanded state class
    const hasExpandedClass = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })

    expect(hasExpandedClass).toBe(true)
  })

  test('@ready can close mobile menu animation', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')

    // Open menu
    await page.click('button[aria-label="toggle menu"]')
    await page.wait(500)

    let hasExpandedClass = await playwrightPage.locator('header#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClass).toBe(true)

    // Close menu
    await page.click('button[aria-label="toggle menu"]')
    await page.wait(500)

    hasExpandedClass = await playwrightPage.locator('header#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClass).toBe(false)
  })

  test('@ready hamburger icon aria-expanded changes on toggle', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')

    const initialExpanded = await page.getAttribute('button[aria-label="toggle menu"]', 'aria-expanded')
    expect(initialExpanded).toBe('false')

    // Toggle menu
    await page.click('button[aria-label="toggle menu"]')
    await page.wait(500)

    const expandedState = await page.getAttribute('button[aria-label="toggle menu"]', 'aria-expanded')
    expect(expandedState).toBe('true')
  })

  test('@ready can navigate to page from mobile menu', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')
    // Navigation links are always visible on mobile
    await page.click('nav#main-nav a[href="/about"]')

    await page.waitForLoadState('networkidle')
    await page.expectUrlContains('/about')
  })

  test('@ready mobile menu has proper ARIA attributes', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')

    const ariaLabel = await page.getAttribute('button[aria-label="toggle menu"]', 'aria-label')
    const navRole = await page.getAttribute('nav#main-nav', 'role')
    const ariaOwns = await page.getAttribute('button[aria-label="toggle menu"]', 'aria-owns')

    expect(ariaLabel).toBe('toggle menu')
    expect(navRole).toBe('navigation')
    expect(ariaOwns).toBe('main-nav')
  })

  test('@ready mobile menu closes after navigation', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')

    // Open menu
    await page.click('button[aria-label="toggle menu"]')
    await page.wait(500)

    const hasExpandedClassBefore = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClassBefore).toBe(true)

    // Navigate to another page
    await page.click('nav#main-nav a[href="/about"]')
    await page.waitForLoadState('networkidle')

    // Menu should be closed after navigation
    const hasExpandedClassAfter = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClassAfter).toBe(false)
  })

  test.skip('@wip mobile menu has backdrop overlay', async ({ page: _playwrightPage }) => {
    // This implementation uses mobile-splash animation, not a backdrop
    test.skip()
  })

  test.skip('@wip clicking backdrop closes mobile menu', async ({ page: _playwrightPage }) => {
    // No backdrop in this implementation
    test.skip()
  })

  test('@ready mobile menu prevents body scroll when open', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')

    // Check body doesn't have no-scroll class initially
    const hasNoScrollClassInitial = await playwrightPage.locator('body').evaluate((el) => {
      return el.classList.contains('no-scroll')
    })
    expect(hasNoScrollClassInitial).toBe(false)

    // Open menu
    await page.click('button[aria-label="toggle menu"]')
    await page.wait(500)

    // Body should have no-scroll class when menu is open
    const hasNoScrollClassOpen = await playwrightPage.locator('body').evaluate((el) => {
      return el.classList.contains('no-scroll')
    })
    expect(hasNoScrollClassOpen).toBe(true)

    // Close menu
    await page.click('button[aria-label="toggle menu"]')
    await page.wait(500)

    // Body should not have no-scroll class when menu is closed
    const hasNoScrollClassClosed = await playwrightPage.locator('body').evaluate((el) => {
      return el.classList.contains('no-scroll')
    })
    expect(hasNoScrollClassClosed).toBe(false)
  })

  test('@ready mobile menu is keyboard accessible', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')

    // Focus on toggle button using keyboard
    await playwrightPage.locator('button[aria-label="toggle menu"]').focus()

    // Open menu with Enter key
    await playwrightPage.keyboard.press('Enter')
    await page.wait(500)

    // Menu should be open
    const hasExpandedClass = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClass).toBe(true)

    // Can tab to navigation links
    await playwrightPage.keyboard.press('Tab')
    const focusedElement = await playwrightPage.evaluate(() => {
      const el = document.activeElement
      return el?.tagName
    })
    expect(focusedElement).toBe('A')
  })

  test('@ready focus is trapped in open mobile menu', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')

    // Open menu
    await page.click('button[aria-label="toggle menu"]')
    await page.wait(500)

    // Tab to first navigation link
    await playwrightPage.keyboard.press('Tab')

    // Focus should be on a navigation link (not the toggle button anymore)
    const focusedElementTag = await playwrightPage.evaluate(() => {
      const el = document.activeElement as HTMLElement
      return el?.tagName
    })
    expect(focusedElementTag).toBe('A')

    // Tab through all menu items
    const navLinks = await playwrightPage.locator('nav#main-nav a').count()

    // Tab through remaining links plus one more to test wrapping
    for (let i = 1; i <= navLinks; i++) {
      await playwrightPage.keyboard.press('Tab')
    }

    // After tabbing past all nav links, focus should be back within the focus trap
    // (either on toggle button or first nav link - both are acceptable focus trap behavior)
    const finalFocusedElement = await playwrightPage.evaluate(() => {
      const el = document.activeElement as HTMLElement
      const ariaLabel = el?.getAttribute('aria-label')
      const tag = el?.tagName
      // Check if focus is on toggle button OR a nav link (both are in the focus trap)
      return { ariaLabel, tag, isInNav: el?.closest('nav#main-nav') !== null }
    })

    // Focus should be either on the toggle button or a nav link (both are in the focus trap)
    const isTrapped = finalFocusedElement.ariaLabel === 'toggle menu' || finalFocusedElement.isInNav
    expect(isTrapped).toBe(true)
  })

  test('@ready pressing Escape closes mobile menu', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    await page.setViewport(375, 667)
    await page.goto('/')

    // Open menu
    await page.click('button[aria-label="toggle menu"]')
    await page.wait(500)

    // Menu should be open
    const hasExpandedClassBefore = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClassBefore).toBe(true)

    // Press Escape to close menu
    await playwrightPage.keyboard.press('Escape')
    await page.wait(500)

    // Menu should be closed
    const hasExpandedClassAfter = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClassAfter).toBe(false)
  })
})
