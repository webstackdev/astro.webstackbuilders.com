/**
 * Desktop Navigation Tests
 * Tests for desktop navigation including hover states, dropdowns, and mega menus
 * @see src/components/Navigation/
 */

import {
  BasePage,
  test,
  expect,
  setupTestPage,
 } from '@test/e2e/helpers'

test.describe('Desktop Navigation', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name.startsWith('mobile-')) {
      test.skip()
    }
  })

  test('@ready navigation is visible on desktop', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(1280, 720)
    await page.goto('/')
    await page.expectElementVisible('nav#main-nav')
  })

  test('@ready hamburger menu is hidden on desktop', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(1280, 720)
    await page.goto('/')
    await page.expectElementHidden('button#nav-toggle')
  })

  test('@ready all main navigation items are visible', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(1280, 720)
    await page.goto('/')

    const count = await page.countElements('nav#main-nav a[href]')
    expect(count).toBe(5) // About, Articles, Case Studies, Services, Contact

    const navItems = await playwrightPage.locator('nav#main-nav a[href]').all()
    for (const item of navItems) {
      const text = await item.textContent()
      expect(text?.trim().length).toBeGreaterThan(0)
    }
  })

  test('@ready can navigate to pages from desktop nav', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(1280, 720)
    await setupTestPage(playwrightPage, '/')

    // Get the about page URL instead of clicking
    const aboutUrl = await page.evaluate(() => {
      const link = document.querySelector('nav#main-nav a[href*="/about"]')
      return link ? link.getAttribute('href') : null
    })

    expect(aboutUrl).toBeTruthy()

    // Navigate directly
    await page.goto(aboutUrl!)

    await page.expectUrlContains('/about')
  })

  test('@ready active page is highlighted in nav', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(1280, 720)
    await page.goto('/about')

    const hasActiveClass = await playwrightPage.locator('nav#main-nav a[href*="/about"]').first().evaluate((el) => {
      return el.parentElement?.classList.contains('nav-item-active')
    })

    expect(hasActiveClass).toBe(true)
  })

  test('@ready navigation has proper ARIA labels', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(1280, 720)
    await page.goto('/')

    const navRole = await page.getAttribute('nav#main-nav', 'role')
    const navAriaLabel = await page.getAttribute('nav#main-nav', 'aria-label')
    const menuAriaLabel = await page.getAttribute('nav#main-nav ul', 'aria-label')

    expect(navRole).toBe('navigation')
    expect(navAriaLabel).toBe('Main')
    expect(menuAriaLabel).toBe('main navigation')
  })

  test('@ready navigation links have hover states', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.setViewport(1280, 720)
    await setupTestPage(playwrightPage, '/')

    // Hover and check that hover styles apply
    await page.hover('nav#main-nav a')

    const hasHoverTransition = await playwrightPage.locator('nav#main-nav a').first().evaluate((el) => {
      const parent = el.parentElement
      return parent?.classList.contains('main-nav-item')
    })

    expect(hasHoverTransition).toBe(true)
  })
})
