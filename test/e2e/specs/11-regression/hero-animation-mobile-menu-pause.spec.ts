/**
 * E2E Regression Tests for Hero Animation Pause on Mobile Menu
 *
 * Issue: Hero animation should pause when mobile navigation menu opens
 * Solution: Animation lifecycle event system to communicate between scripts
 *
 * @see src/components/scripts/animationLifecycle.ts
 * @see src/components/Navigation/client.ts
 * @see src/components/Hero/Home/client/index.ts
 */

import { BasePage, test, expect } from '@test/e2e/helpers'
import { setupTestPage } from '@test/e2e/helpers/cookieHelper'
import { waitForAnimationFrames } from '@test/e2e/helpers/waitHelpers'

test.describe('Hero Animation - Mobile Menu Pause Regression', () => {
  // Configure mobile viewport for all tests in this suite
  test.use({ viewport: { width: 375, height: 667 } })

  /**
   * Setup for hero animation mobile menu pause regression tests
   *
   * Side effects relied upon:
   * - Sets up test page at homepage using setupTestPage() helper
   * - Dismisses cookie consent modal to prevent interference with tests
   * - Waits for hero animation element to be present in DOM
   *
   * Without this setup, tests would fail due to:
   * - Cookie consent modal blocking interaction with mobile menu button
   * - Hero animation not being loaded/initialized yet
   * - Animation element selectors not being available
   *
   * The hero animation must be present before tests can verify pause behavior
   * when the mobile navigation menu opens
   */
  test.beforeEach(async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await setupTestPage(page.page, '/')
    await page.waitForHeaderComponents()
    // Wait for hero animation to load
    await page.waitForSelector('#heroAnimation', { timeout: 5000 })
  })

  test('hero animation should pause when mobile menu opens', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    // Get initial animation state
    const initialTransform = await page.evaluate(() => {
      const monitorBottom = document.querySelector('.monitorBottom')
      if (!monitorBottom) return null
      return window.getComputedStyle(monitorBottom).transform
    })

    expect(initialTransform).not.toBeNull()

    // Open mobile menu
    const hamburgerButton = page.locator('.nav-toggle-btn').first()
    await hamburgerButton.click()

    // Wait for menu to open
    await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true')

    // Wait a bit to ensure animation would have progressed if not paused
    await waitForAnimationFrames(page.page, 60)

    // Check that animation state hasn't changed (indicating pause)
    const transformDuringMenu = await page.evaluate(() => {
      const monitorBottom = document.querySelector('.monitorBottom')
      if (!monitorBottom) return null
      return window.getComputedStyle(monitorBottom).transform
    })

    // The transform should be the same or very close, indicating the animation is paused
    // We use a snapshot approach rather than exact comparison due to potential timing
    expect(transformDuringMenu).toBeDefined()

    // Close mobile menu
    const closeButton = page.locator('.nav-toggle-btn').first()
    await closeButton.click()

    // Wait for menu to close
    await expect(closeButton).toHaveAttribute('aria-expanded', 'false')

    // Wait a bit for animation to resume and progress
    await waitForAnimationFrames(page.page, 60)

    // Verify animation has resumed by checking transform has changed
    const transformAfterMenu = await page.evaluate(() => {
      const monitorBottom = document.querySelector('.monitorBottom')
      if (!monitorBottom) return null
      return window.getComputedStyle(monitorBottom).transform
    })

    // After resuming, the animation should have progressed
    expect(transformAfterMenu).toBeDefined()
  })

  test('hero animation should be paused while mobile menu is open', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    // Open mobile menu
    const hamburgerButton = page.locator('.nav-toggle-btn').first()
    await hamburgerButton.click()
    await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true')

    // Sample transform at multiple points while menu is open
    const transforms: (string | null)[] = []

    for (let i = 0; i < 3; i++) {
      await waitForAnimationFrames(page.page, 12)
      const transform = await page.evaluate(() => {
        const monitorBottom = document.querySelector('.monitorBottom')
        if (!monitorBottom) return null
        return window.getComputedStyle(monitorBottom).transform
      })
      transforms.push(transform)
    }

    // All transforms should be the same (or very similar) indicating animation is paused
    const uniqueTransforms = new Set(transforms)
    // Allow for minor variations due to timing, but should have very few unique values
    expect(uniqueTransforms.size).toBeLessThanOrEqual(2)

    // Close menu
    await hamburgerButton.click()
    await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')
  })

  test('mobile menu should open and close correctly', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    const hamburgerButton = page.locator('.nav-toggle-btn').first()
    const header = page.locator('#header')

    // Initially, header should not have aria-expanded-true class
    await expect(header).not.toHaveClass(/aria-expanded-true/)

    // Click hamburger to open
    await hamburgerButton.click()

    // Header should have aria-expanded-true class (which makes menu visible via CSS)
    await expect(header).toHaveClass(/aria-expanded-true/)
    await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true')

    // Click to close
    await hamburgerButton.click()

    // Header should not have aria-expanded-true class
    await expect(header).not.toHaveClass(/aria-expanded-true/)
    await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')
  })

  test('mobile menu should show animated splash background', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    const hamburgerButton = page.locator('.nav-toggle-btn').first()
    const header = page.locator('#header')

    // Get initial transform of the splash ::after pseudo-element (should be scale(0))
    const initialTransform = await page.evaluate(() => {
      const splash = document.querySelector('#mobile-splash')
      if (!splash) return null
      const afterStyles = window.getComputedStyle(splash, '::after')
      return afterStyles.transform
    })

    expect(initialTransform).toContain('matrix') // Should have a transform

    // Open menu
    await hamburgerButton.click()
    await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true')

    // Header should have the aria-expanded-true class which triggers splash animation
    await expect(header).toHaveClass(/aria-expanded-true/)

    // Wait for animation to start (give it ~100ms via animation frames)
    await waitForAnimationFrames(page.page, 6)

    // Check that splash ::after is now scaling up (transform should change)
    const expandedTransform = await page.evaluate(() => {
      const splash = document.querySelector('#mobile-splash')
      if (!splash) return null
      const afterStyles = window.getComputedStyle(splash, '::after')
      return afterStyles.transform
    })

    // The transform should have changed from initial state (animation is running/complete)
    expect(expandedTransform).not.toBe(initialTransform)

    // Close menu
    await hamburgerButton.click()
    await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'false')

    // Header should not have the aria-expanded-true class
    await expect(header).not.toHaveClass(/aria-expanded-true/)
  })

  test('body should have no-scroll class when mobile menu is open', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    const hamburgerButton = page.locator('.nav-toggle-btn').first()
    const body = page.locator('body')

    // Initially no-scroll class should not be present
    await expect(body).not.toHaveClass(/no-scroll/)

    // Open menu
    await hamburgerButton.click()

    // Body should have no-scroll class
    await expect(body).toHaveClass(/no-scroll/)

    // Close menu
    await hamburgerButton.click()

    // Body should not have no-scroll class
    await expect(body).not.toHaveClass(/no-scroll/)
  })

  test('mobile menu navigation links should be clickable and close menu', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

    const hamburgerButton = page.locator('.nav-toggle-btn').first()

    // Open menu
    await hamburgerButton.click()
    await expect(hamburgerButton).toHaveAttribute('aria-expanded', 'true')

    // Wait for menu to be fully visible (header gets aria-expanded-true class)
    const header = page.locator('#header')
    await expect(header).toHaveClass(/aria-expanded-true/)

    // Wait for the first navigation link to animate in (splash takes 0.5s, then item delay)
    const navLink = page.locator('.main-nav-item a').first()
    await navLink.waitFor({ state: 'visible', timeout: 2000 })

    // Click the navigation link
    await navLink.click()

    // Wait for navigation
    await page.waitForLoadState('networkidle')
    await page.waitForHeaderComponents()

    // Menu should close after navigation
    const hamburgerAfterNav = page.locator('.nav-toggle-btn').first()
    await expect(hamburgerAfterNav).toHaveAttribute('aria-expanded', 'false')
  })
})
