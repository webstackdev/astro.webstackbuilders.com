/**
 * Theme Switching Visual Tests
 * Visual regression tests for light/dark theme switching
 */

import { BasePage, test, expect } from '@test/e2e/helpers'
import { waitForAnimationFrames } from '@test/e2e/helpers/waitHelpers'
import { wait } from '@test/e2e/helpers/waitTimeouts'

async function setTheme(page: BasePage, theme: string): Promise<void> {
  await page.evaluate((nextTheme) => {
    document.documentElement.setAttribute('data-theme', nextTheme)
  }, theme)
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', theme)
  await waitForAnimationFrames(page.page, 2)
}

test.describe('Theme Switching Visuals', () => {
  test.skip('@blocked light theme screenshot baseline', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Blocked by: Need visual regression testing setup (e.g., Percy, Chromatic)
    // Expected: Capture baseline screenshot of light theme
    await page.goto("/")

    await setTheme(page, 'light')

    // TODO: Integrate visual testing tool
    // await percySnapshot(page, 'Homepage - Light Theme')
  })

  test.skip('@blocked dark theme screenshot baseline', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Blocked by: Need visual regression testing setup
    // Expected: Capture baseline screenshot of dark theme
    await page.goto("/")

    await setTheme(page, 'dark')

    // TODO: Integrate visual testing tool
    // await percySnapshot(page, 'Homepage - Dark Theme')
  })

  test.skip('@wip theme colors are applied correctly', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
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
    const html = page.locator('html')
    const initialTheme = await html.getAttribute('data-theme')
    await themePicker.click()
    await expect
      .poll(async () => await html.getAttribute('data-theme'), { intervals: [200], timeout: wait.quickAssert })
      .not.toBe(initialTheme)
    await waitForAnimationFrames(page.page, 2)

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
    const page = await BasePage.init(playwrightPage)
    // Blocked by: Need visual regression testing
    // Expected: Should detect visual differences between themes
    await page.goto("/about")

    // Light theme
    await setTheme(page, 'light')
    // await percySnapshot(page, 'About Page - Light')

    // Dark theme
    await setTheme(page, 'dark')
    // await percySnapshot(page, 'About Page - Dark')
  })

  test.skip('@wip no broken images in either theme', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: All images should load in both themes
    const themes = ['light', 'dark']

    for (const theme of themes) {
      await page.goto("/")
      await setTheme(page, theme)

      const brokenImages = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'))
        return images.filter((img) => !img.complete || img.naturalHeight === 0).length
      })

      expect(brokenImages).toBe(0)
    }
  })

  test.skip('@wip text remains readable in both themes', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Expected: Text should have sufficient contrast in both themes
    await page.goto("/")

    const themes = ['light', 'dark']

    for (const theme of themes) {
      await setTheme(page, theme)

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
    const page = await BasePage.init(playwrightPage)
    // Blocked by: Need visual regression testing
    // Expected: Articles should look good in both themes
    await page.goto("/articles")
    const firstArticle = page.locator('a[href*="/articles/"]').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    // Light
    await setTheme(page, 'light')
    // await percySnapshot(page, 'Article - Light')

    // Dark
    await setTheme(page, 'dark')
    // await percySnapshot(page, 'Article - Dark')
  })

  test.skip('@wip theme transition is smooth', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)

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
    const page = await BasePage.init(playwrightPage)

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
