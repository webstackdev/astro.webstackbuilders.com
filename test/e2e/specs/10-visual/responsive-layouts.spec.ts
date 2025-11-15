/**
 * Responsive Layout Visual Tests
 * Visual regression tests for responsive layouts across viewports
 */

import { BasePage, test, expect } from '@test/e2e/helpers'

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  wide: { width: 1920, height: 1080 },
}

test.describe('Responsive Layout Visuals', () => {
  test.skip('@blocked mobile viewport screenshot', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Blocked by: Need visual regression testing setup
    // Expected: Capture mobile layout
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto("/")

    // TODO: Visual testing
    // await percySnapshot(page, 'Homepage - Mobile')
  })

  test.skip('@blocked tablet viewport screenshot', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Blocked by: Need visual regression testing setup
    // Expected: Capture tablet layout
    await page.setViewportSize(VIEWPORTS.tablet)
    await page.goto("/")

    // TODO: Visual testing
    // await percySnapshot(page, 'Homepage - Tablet')
  })

  test.skip('@blocked desktop viewport screenshot', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Blocked by: Need visual regression testing setup
    // Expected: Capture desktop layout
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto("/")

    // TODO: Visual testing
    // await percySnapshot(page, 'Homepage - Desktop')
  })

  test.skip('@blocked wide viewport screenshot', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Blocked by: Need visual regression testing setup
    // Expected: Capture wide desktop layout
    await page.setViewportSize(VIEWPORTS.wide)
    await page.goto("/")

    // TODO: Visual testing
    // await percySnapshot(page, 'Homepage - Wide')
  })

  test.skip('@wip no horizontal scroll on mobile', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Content should not cause horizontal scroll
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto("/")

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })

  test.skip('@wip no horizontal scroll on tablet', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: No horizontal overflow on tablet
    await page.setViewportSize(VIEWPORTS.tablet)
    await page.goto("/")

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })

  test.skip('@wip images scale correctly on mobile', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Images should not overflow container
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto("/")

    const oversizedImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'))
      return images.filter((img) => img.width > window.innerWidth).length
    })

    expect(oversizedImages).toBe(0)
  })

  test.skip('@wip mobile navigation works', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Mobile menu should be functional
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto("/")

    const hamburger = page.locator('[data-nav-toggle]')
    await expect(hamburger).toBeVisible()

    await hamburger.click()
    await page.waitForTimeout(300)

    const menu = page.locator('[data-nav-menu]')
    await expect(menu).toBeVisible()
  })

  test.skip('@wip desktop navigation shows all items', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Desktop nav should show all links inline
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto("/")

    const nav = page.locator('nav[data-nav-desktop]')
    await expect(nav).toBeVisible()

    const hamburger = page.locator('[data-nav-toggle]')
    await expect(hamburger).not.toBeVisible()
  })

  test.skip('@blocked article page responsive comparison', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Blocked by: Need visual regression testing
    // Expected: Article should look good at all sizes
    await page.goto("/articles")
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    for (const [_name, viewport] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(500)
      // await percySnapshot(page, `Article - ${_name}`)
    }
  })

  test.skip('@wip footer stacks correctly on mobile', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Footer content should stack vertically on mobile
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto("/")

    const footer = page.locator('footer')
    const footerHeight = await footer.evaluate((el) => (el as HTMLElement).offsetHeight)

    // Footer should be taller on mobile (stacked content)
    expect(footerHeight).toBeGreaterThan(100)
  })

  test.skip('@wip text is readable at all sizes', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Font sizes should be appropriate for each viewport
    const viewports = [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto("/")

      const fontSize = await page.evaluate(() => {
        const body = document.body
        const styles = window.getComputedStyle(body)
        return parseFloat(styles.fontSize)
      })

      // Font should be at least 14px
      expect(fontSize).toBeGreaterThanOrEqual(14)
    }
  })

  test.skip('@wip touch targets are appropriately sized on mobile', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Interactive elements should be at least 44x44px on mobile
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto("/")

    const buttons = page.locator('button, a')
    const count = await buttons.count()

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const box = await button.boundingBox()
        if (box) {
          expect(box.height).toBeGreaterThan(30) // 44 is ideal, 30 is minimum
        }
      }
    }
  })

  test.skip('@wip forms are usable on mobile', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Form fields should be appropriately sized for touch
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto("/contact")

    const emailInput = page.locator('input[type="email"]').first()
    const box = await emailInput.boundingBox()

    expect(box?.height).toBeGreaterThan(35)
  })
})
