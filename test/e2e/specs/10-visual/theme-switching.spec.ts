/**
 * Theme Switching Visual Tests
 * Visual regression tests for light/dark theme switching
 */

import { BasePage, test, expect } from '@test/e2e/helpers'

test.describe('Theme Switching Visuals', () => {
  test.skip('@blocked light theme screenshot baseline', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Blocked by: Need visual regression testing setup (e.g., Percy, Chromatic)
    // Expected: Capture baseline screenshot of light theme
    await page.goto("/")

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light')
    })

    await page.waitForTimeout(500)

    // TODO: Integrate visual testing tool
    // await percySnapshot(page, 'Homepage - Light Theme')
  })

  test.skip('@blocked dark theme screenshot baseline', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Blocked by: Need visual regression testing setup
    // Expected: Capture baseline screenshot of dark theme
    await page.goto("/")

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark')
    })

    await page.waitForTimeout(500)

    // TODO: Integrate visual testing tool
    // await percySnapshot(page, 'Homepage - Dark Theme')
  })

  test.skip('@wip theme colors are applied correctly', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Theme switch should change CSS variables
    await page.goto("/")

    // Get light theme colors
    const lightColors = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.documentElement)
      return {
        bg: styles.getPropertyValue('--color-bg') || styles.backgroundColor,
        text: styles.getPropertyValue('--color-text') || styles.color,
      }
    })

    // Switch to dark theme
    const themePicker = page.locator('[data-theme-picker]')
    await themePicker.click()
    await page.waitForTimeout(500)

    // Get dark theme colors
    const darkColors = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.documentElement)
      return {
        bg: styles.getPropertyValue('--color-bg') || styles.backgroundColor,
        text: styles.getPropertyValue('--color-text') || styles.color,
      }
    })

    // Colors should be different
    expect(lightColors.bg).not.toBe(darkColors.bg)
  })

  test.skip('@blocked compare light vs dark theme visually', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Blocked by: Need visual regression testing
    // Expected: Should detect visual differences between themes
    await page.goto("/about")

    // Light theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light')
    })
    await page.waitForTimeout(500)
    // await percySnapshot(page, 'About Page - Light')

    // Dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark')
    })
    await page.waitForTimeout(500)
    // await percySnapshot(page, 'About Page - Dark')
  })

  test.skip('@wip no broken images in either theme', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: All images should load in both themes
    const themes = ['light', 'dark']

    for (const theme of themes) {
      await page.goto("/")

      await page.page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t)
      }, theme)

      await page.waitForTimeout(500)

      const brokenImages = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'))
        return images.filter((img) => !img.complete || img.naturalHeight === 0).length
      })

      expect(brokenImages).toBe(0)
    }
  })

  test.skip('@wip text remains readable in both themes', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Expected: Text should have sufficient contrast in both themes
    await page.goto("/")

    const themes = ['light', 'dark']

    for (const theme of themes) {
      await page.page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t)
      }, theme)

      await page.waitForTimeout(300)

      const textElement = page.locator('p').first()
      const styles = await textElement.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        }
      })

      // Basic check that colors are defined
      expect(styles.color).toBeTruthy()
    }
  })

  test.skip('@blocked article page theme comparison', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Blocked by: Need visual regression testing
    // Expected: Articles should look good in both themes
    await page.goto("/articles")
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    // Light
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light')
    })
    await page.waitForTimeout(500)
    // await percySnapshot(page, 'Article - Light')

    // Dark
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark')
    })
    await page.waitForTimeout(500)
    // await percySnapshot(page, 'Article - Dark')
  })

  test.skip('@wip theme transition is smooth', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    
    // Expected: Theme switch should have smooth transition
    await page.goto("/")

    const hasTransition = await page.evaluate(() => {
      const html = document.documentElement
      const styles = window.getComputedStyle(html)
      return styles.transition !== 'all 0s ease 0s'
    })

    expect(hasTransition).toBe(true)
  })

  test.skip('@wip no flash of wrong theme on load', async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    
    // Expected: Should not show wrong theme before switching
    // This tests the theme loading script

    await page.goto("/")

    // Check that theme is set before render
    const themeSetEarly = await page.evaluate(() => {
      return document.documentElement.hasAttribute('data-theme')
    })

    expect(themeSetEarly).toBe(true)
  })
})
