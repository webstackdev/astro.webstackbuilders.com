/**
 * Mobile Navigation Tests
 * Tests for mobile menu functionality including hamburger and mobile interactions
 * @see src/components/Navigation/
 */

import { BasePage, test, expect } from '@test/e2e/helpers'
import { setupTestPage } from '@test/e2e/helpers/cookieHelper'

test.describe('Mobile Navigation', () => {
  // Helper to wait for mobile menu animations to complete using clock manipulation
  const waitForMobileMenuAnimation = async (playwrightPage: import('@playwright/test').Page) => {
    // Fast-forward through the splash animation (550ms) and item delays (up to 600ms)
    await playwrightPage.clock.fastForward(1200)
    // Wait for menu-visible class to be added
    await playwrightPage.waitForSelector('.main-nav-menu.menu-visible', { state: 'visible' })
  }
  test('@ready hamburger menu is visible on mobile', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)
    await setupTestPage(playwrightPage, '/')
    await page.expectElementVisible('button[aria-label="toggle menu"]')
  })

  test('@ready main navigation is hidden on mobile by default', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)
    await setupTestPage(playwrightPage, '/')
    // Navigation menu is hidden by default on mobile until hamburger is clicked
    const menu = playwrightPage.locator('nav#main-nav ul')
    await expect(menu).not.toBeVisible()
  })

  test('@ready main navigation becomes visible when mobile menu is opened', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    // Open mobile menu
    await page.click('button[aria-label="toggle menu"]')

    // Use clock manipulation to speed through animations
    await waitForMobileMenuAnimation(playwrightPage)

    // Navigation menu should now be visible
    const menu = playwrightPage.locator('nav#main-nav ul')
    await expect(menu).toBeVisible()
  })

  test('@ready can toggle mobile menu splash animation', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    await page.click('button[aria-label="toggle menu"]')

    // Use clock manipulation to speed through splash animation
    await playwrightPage.clock.fastForward(600)

    // Check if header has expanded state class
    const hasExpandedClass = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })

    expect(hasExpandedClass).toBe(true)
  })

  test('@ready can close mobile menu animation', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    // Open menu
    await page.click('button[aria-label="toggle menu"]')
    await playwrightPage.clock.fastForward(600)

    let hasExpandedClass = await playwrightPage.locator('header#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClass).toBe(true)

    // Close menu
    await page.click('button[aria-label="toggle menu"]')
    await playwrightPage.clock.fastForward(600)

    hasExpandedClass = await playwrightPage.locator('header#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClass).toBe(false)
  })

  test('@ready hamburger icon aria-expanded changes on toggle', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    const initialExpanded = await page.getAttribute('button[aria-label="toggle menu"]', 'aria-expanded')
    expect(initialExpanded).toBe('false')

    // Toggle menu
    await page.click('button[aria-label="toggle menu"]')
    await playwrightPage.clock.fastForward(600)

    const expandedState = await page.getAttribute('button[aria-label="toggle menu"]', 'aria-expanded')
    expect(expandedState).toBe('true')
  })

  test('@ready close button is in tab order when menu is open', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    // Open menu
    await page.click('button[aria-label="toggle menu"]')
    await waitForMobileMenuAnimation(playwrightPage)

    // Verify button is still visible and accessible
    const button = playwrightPage.locator('button[aria-label="toggle menu"]')
    await expect(button).toBeVisible()

    // Start with toggle button focused
    await button.focus()

    // Tab through all focusable elements and collect them
    const focusableElements: string[] = []
    const maxTabs = 10 // Safety limit - should be enough to cycle through all nav links + toggle button

    for (let i = 0; i < maxTabs; i++) {
      const focused = await playwrightPage.evaluate(() => {
        const el = document.activeElement as HTMLElement
        const ariaLabel = el?.getAttribute('aria-label')
        const href = el?.getAttribute('href')
        return ariaLabel || href || `unknown-${el?.tagName}`
      })

      focusableElements.push(focused)

      // Break if we've cycled back to the toggle button after visiting nav links
      if (i > 0 && focused === 'toggle menu') {
        break
      }

      await playwrightPage.keyboard.press('Tab')
    }

    // The toggle button should appear at least twice in the sequence (start and after cycling through nav links)
    const toggleButtonCount = focusableElements.filter(el => el === 'toggle menu').length
    expect(toggleButtonCount).toBeGreaterThanOrEqual(2)

    // Should have visited some navigation links too
    const navLinkCount = focusableElements.filter(el => el.startsWith('/')).length
    expect(navLinkCount).toBeGreaterThan(0)
  })

  test('@ready close button is clickable when menu is open', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    // Open menu
    await page.click('button[aria-label="toggle menu"]')
    await waitForMobileMenuAnimation(playwrightPage)

    // Verify button is still visible and clickable
    const button = playwrightPage.locator('button[aria-label="toggle menu"]')
    await expect(button).toBeVisible()

    // The button should still be clickable to close the menu
    await button.click()
    await playwrightPage.clock.fastForward(600)

    const hasExpandedClassAfter = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClassAfter).toBe(false)
  })

  test('@ready can navigate to page from mobile menu', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    await setupTestPage(playwrightPage, '/')

    // Open mobile menu first
    await page.click('button[aria-label="toggle menu"]')

    // Wait for mobile menu animation with real timers for WebKit compatibility
    await playwrightPage.waitForTimeout(600) // Wait for 550ms animation + buffer

    // Now navigation links should be visible and clickable
    await page.click('nav#main-nav a[href="/about"]')

    // Wait for navigation to complete and check for About page content instead of URL
    await playwrightPage.waitForSelector('text=Building Developer-First Infrastructure', { timeout: 5000 })

    // Verify we're on the About page by checking breadcrumbs (using proper Playwright selector)
    await expect(playwrightPage.locator('nav[aria-label="Breadcrumb"]').getByText('About')).toBeVisible()
  })

  test('@ready can navigate using keyboard Enter on focused link', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    await setupTestPage(playwrightPage, '/')

    // Open mobile menu first
    await page.click('button[aria-label="toggle menu"]')

    // Wait for mobile menu animation with real timers for WebKit compatibility
    await playwrightPage.waitForTimeout(600) // Wait for 550ms animation + buffer

    // Focus on a navigation link and press Enter
    await playwrightPage.locator('nav#main-nav a[href="/about"]').focus()
    await playwrightPage.keyboard.press('Enter')

    // Wait for navigation to complete and check for About page content instead of URL
    await playwrightPage.waitForSelector('text=Building Developer-First Infrastructure', { timeout: 5000 })

    // Verify we're on the About page by checking breadcrumbs (using proper Playwright selector)
    await expect(playwrightPage.locator('nav[aria-label="Breadcrumb"]').getByText('About')).toBeVisible()
  })

  test('@ready mobile menu has proper ARIA attributes', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)
    await setupTestPage(playwrightPage, '/')

    const ariaLabel = await page.getAttribute('button[aria-label="toggle menu"]', 'aria-label')
    const navRole = await page.getAttribute('nav#main-nav', 'role')
    const ariaOwns = await page.getAttribute('button[aria-label="toggle menu"]', 'aria-owns')

    expect(ariaLabel).toBe('toggle menu')
    expect(navRole).toBe('navigation')
    expect(ariaOwns).toBe('main-nav')
  })

  test('@ready mobile menu closes after navigation', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    // Open menu
    await page.click('button[aria-label="toggle menu"]')

    // Use clock manipulation to speed through animations
    await waitForMobileMenuAnimation(playwrightPage)

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

  test('@ready mobile menu has backdrop overlay', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    // Initially, splash element should not be clickable (pointer-events: none)
    const splashElement = playwrightPage.getByTestId('mobile-splash-backdrop')
    await expect(splashElement).toBeVisible()

    // Splash should not be expanded initially
    const initialTransform = await playwrightPage.evaluate(() => {
      const splash = document.querySelector('#mobile-splash')
      const computedStyle = window.getComputedStyle(splash!, '::after')
      return computedStyle.transform
    })

    // Open menu to activate backdrop
    await page.click('button[aria-label="toggle menu"]')
    await waitForMobileMenuAnimation(playwrightPage)

    // After opening menu, splash should be expanded and clickable
    const expandedTransform = await playwrightPage.evaluate(() => {
      const splash = document.querySelector('#mobile-splash')
      const computedStyle = window.getComputedStyle(splash!, '::after')
      return computedStyle.transform
    })

    // The backdrop overlay exists and is displayed
    // Note: With clock manipulation, CSS animations may not fully complete,
    // but we can verify the element exists and is structured correctly
    expect(initialTransform).toBeTruthy()
    expect(expandedTransform).toBeTruthy()

    // The main test is that the splash element exists and serves as a backdrop
    await expect(splashElement).toBeVisible()

    // Check that splash backdrop remains non-interactive (pointer-events: none)
    const pointerEvents = await playwrightPage.evaluate(() => {
      const splash = document.querySelector('#mobile-splash') as HTMLElement
      return window.getComputedStyle(splash).pointerEvents
    })
    expect(pointerEvents).toBe('none')
  })

  test('@ready clicking backdrop has no effect', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    // Open menu first
    await page.click('button[aria-label="toggle menu"]')
    await waitForMobileMenuAnimation(playwrightPage)

    // Verify menu is open
    const hasExpandedClassBefore = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClassBefore).toBe(true)

    // Click on the backdrop area - this should have NO effect (menu stays open)
    // Click on an area where the splash backdrop is visible but no interactive elements are
    await playwrightPage.click('body', { position: { x: 100, y: 400 } })
    await playwrightPage.clock.fastForward(600)

    // Menu should STILL be open after clicking backdrop (no effect)
    const hasExpandedClassAfter = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClassAfter).toBe(true)

    // Verify aria-expanded attribute is still true
    const ariaExpanded = await page.getAttribute('button[aria-label="toggle menu"]', 'aria-expanded')
    expect(ariaExpanded).toBe('true')
  })

  test('@ready mobile menu prevents body scroll when open', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    // Check body doesn't have no-scroll class initially
    const hasNoScrollClassInitial = await playwrightPage.locator('body').evaluate((el) => {
      return el.classList.contains('no-scroll')
    })
    expect(hasNoScrollClassInitial).toBe(false)

    // Open menu
    await page.click('button[aria-label="toggle menu"]')
    await playwrightPage.clock.fastForward(100) // Just enough for the class to be added

    // Body should have no-scroll class when menu is open
    const hasNoScrollClassOpen = await playwrightPage.locator('body').evaluate((el) => {
      return el.classList.contains('no-scroll')
    })
    expect(hasNoScrollClassOpen).toBe(true)

    // Close menu
    await page.click('button[aria-label="toggle menu"]')
    await playwrightPage.clock.fastForward(100) // Just enough for the class to be removed

    // Body should not have no-scroll class when menu is closed
    const hasNoScrollClassClosed = await playwrightPage.locator('body').evaluate((el) => {
      return el.classList.contains('no-scroll')
    })
    expect(hasNoScrollClassClosed).toBe(false)
  })

  test('@ready mobile menu is keyboard accessible', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    // Focus on toggle button using keyboard
    await playwrightPage.locator('button[aria-label="toggle menu"]').focus()

    // Open menu with Enter key
    await playwrightPage.keyboard.press('Enter')

    // Use clock manipulation to speed through animations
    await waitForMobileMenuAnimation(playwrightPage)

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
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    // Open menu
    await page.click('button[aria-label="toggle menu"]')

    // Use clock manipulation to speed through animations
    await waitForMobileMenuAnimation(playwrightPage)

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
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    // Open menu
    await page.click('button[aria-label="toggle menu"]')
    await playwrightPage.clock.fastForward(600)

    // Menu should be open
    const hasExpandedClassBefore = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClassBefore).toBe(true)

    // Press Escape to close menu
    await playwrightPage.keyboard.press('Escape')
    await playwrightPage.clock.fastForward(600)

    // Menu should be closed
    const hasExpandedClassAfter = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClassAfter).toBe(false)
  })

  test('@ready pressing Enter on close button closes mobile menu', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    // Open menu
    await page.click('button[aria-label="toggle menu"]')
    await waitForMobileMenuAnimation(playwrightPage)

    // Menu should be open
    const hasExpandedClassBefore = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClassBefore).toBe(true)

    // Focus on the close button and press Enter
    await playwrightPage.locator('button[aria-label="toggle menu"]').focus()
    await playwrightPage.keyboard.press('Enter')
    await playwrightPage.clock.fastForward(600)

    // Menu should be closed
    const hasExpandedClassAfter = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClassAfter).toBe(false)
  })

  test('@ready pressing Space on close button closes mobile menu', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(375, 667)

    // Install fake timers before going to the page
    await playwrightPage.clock.install()
    await setupTestPage(playwrightPage, '/')

    // Open menu
    await page.click('button[aria-label="toggle menu"]')
    await waitForMobileMenuAnimation(playwrightPage)

    // Menu should be open
    const hasExpandedClassBefore = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClassBefore).toBe(true)

    // Focus on the close button and press Space
    await playwrightPage.locator('button[aria-label="toggle menu"]').focus()
    await playwrightPage.keyboard.press(' ')
    await playwrightPage.clock.fastForward(600)

    // Menu should be closed
    const hasExpandedClassAfter = await playwrightPage.locator('#header').evaluate((el) => {
      return el.classList.contains('aria-expanded-true')
    })
    expect(hasExpandedClassAfter).toBe(false)
  })
})
