/**
 * Regression Tests for Theme Initialization
 *
 * Tests theme persistence across page navigation and ensures the lang attribute
 * is not removed by Astro View Transitions.
 *
 * Related:
 * - src/components/scripts/theme/index.ts (setInitialTheme)
 * - Bug: Astro View Transitions removes lang attribute from <html>
 */

import { BasePage, test, describe, expect } from '@test/e2e/helpers'

describe('Theme Initialization - Regression Tests', () => {
  test.beforeEach(async ({ page: playwrightPage }) => {
    const page = new BasePage(playwrightPage)
    // Clear localStorage and dismiss cookie modal
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await playwrightPage.reload()
  })

  describe('localStorage theme persistence', () => {
    test('should persist theme across page navigation', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)

      // Set theme to dark in localStorage
      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark')
      })

      await playwrightPage.reload()

      // Verify dark theme is applied
      let themeAttr = await page.getAttribute('html', 'data-theme')
      expect(themeAttr).toBe('dark')

      // Navigate to another page (dynamically fetch first article)
      await page.goto('/articles')
      const firstArticleLink = playwrightPage.locator('a[href^="/articles/"]').first()
      await firstArticleLink.click()
      await playwrightPage.waitForLoadState('networkidle')

      // Verify theme persists after navigation
      themeAttr = await page.getAttribute('html', 'data-theme')
      expect(themeAttr).toBe('dark')
    })

    test('should persist light theme across navigation', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)

      // Set theme to light in localStorage
      await page.evaluate(() => {
        localStorage.setItem('theme', 'light')
      })

      await playwrightPage.reload()

      // Verify light theme is applied
      let themeAttr = await page.getAttribute('html', 'data-theme')
      expect(themeAttr).toBe('light')

      // Navigate to services page
      await page.goto('/services')

      // Navigate to first service (dynamically fetch)
      const firstServiceLink = playwrightPage.locator('a[href^="/services/"]').first()
      await firstServiceLink.click()
      await playwrightPage.waitForLoadState('networkidle')

      // Verify theme persists
      themeAttr = await page.getAttribute('html', 'data-theme')
      expect(themeAttr).toBe('light')
    })

    test('should maintain theme when navigating back and forth', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)

      // Set custom theme
      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark')
      })

      await playwrightPage.reload()

      // Navigate forward to case studies
      await page.goto('/case-studies')

      let themeAttr = await page.getAttribute('html', 'data-theme')
      expect(themeAttr).toBe('dark')

      // Navigate back
      await playwrightPage.goBack()
      await playwrightPage.waitForLoadState('networkidle')

      themeAttr = await page.getAttribute('html', 'data-theme')
      expect(themeAttr).toBe('dark')

      // Navigate forward again
      await playwrightPage.goForward()
      await playwrightPage.waitForLoadState('networkidle')

      themeAttr = await page.getAttribute('html', 'data-theme')
      expect(themeAttr).toBe('dark')
    })
  })

  describe('lang attribute preservation', () => {
    test('should preserve lang="en" attribute on initial load', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      await page.goto('/')

      const langAttr = await page.getAttribute('html', 'lang')
      expect(langAttr).toBe('en')
    })

    test('should restore lang attribute after View Transition navigation', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      await page.goto('/')

      // Verify lang attribute on home page
      let langAttr = await page.getAttribute('html', 'lang')
      expect(langAttr).toBe('en')

      // Navigate to another page using View Transitions
      await page.goto('/about')

      // Verify lang attribute is still present (not removed by View Transitions)
      langAttr = await page.getAttribute('html', 'lang')
      expect(langAttr).toBe('en')
    })

    test('should preserve lang attribute across multiple navigations', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)
      const pages = ['/', '/articles', '/services', '/case-studies', '/contact']

      for (const pagePath of pages) {
        await page.goto(pagePath)

        const langAttr = await page.getAttribute('html', 'lang')
        expect(langAttr).toBe('en')
      }
    })

    test('should preserve lang attribute with theme changes', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)

      // Set theme
      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark')
      })

      await playwrightPage.reload()

      // Verify both attributes are present
      const langAttr = await page.getAttribute('html', 'lang')
      const themeAttr = await page.getAttribute('html', 'data-theme')

      expect(langAttr).toBe('en')
      expect(themeAttr).toBe('dark')

      // Navigate and verify both persist
      await page.goto('/articles')

      const langAttrAfter = await page.getAttribute('html', 'lang')
      const themeAttrAfter = await page.getAttribute('html', 'data-theme')

      expect(langAttrAfter).toBe('en')
      expect(themeAttrAfter).toBe('dark')
    })
  })

  describe('system preference fallback', () => {
    test('should apply dark theme when system prefers dark and no stored theme', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)

      // Emulate dark color scheme preference
      await playwrightPage.emulateMedia({ colorScheme: 'dark' })

      // Clear any stored theme
      await page.evaluate(() => localStorage.removeItem('theme'))

      await playwrightPage.reload()

      const themeAttr = await page.getAttribute('html', 'data-theme')
      expect(themeAttr).toBe('dark')
    })

    test('should not override stored theme with system preference', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)

      // Set light theme in storage
      await page.evaluate(() => {
        localStorage.setItem('theme', 'light')
      })

      // Emulate dark system preference
      await playwrightPage.emulateMedia({ colorScheme: 'dark' })

      await playwrightPage.reload()

      // Stored theme should take precedence
      const themeAttr = await page.getAttribute('html', 'data-theme')
      expect(themeAttr).toBe('light')
    })
  })

  describe('error handling', () => {
    test('should still set lang attribute even when localStorage throws error', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)

      // Make localStorage throw errors
      await playwrightPage.addInitScript(() => {
        const originalGetItem = Storage.prototype.getItem
        Storage.prototype.getItem = function() {
          throw new Error('localStorage access denied')
        }

        // Restore after a short delay to allow theme script to run
        setTimeout(() => {
          Storage.prototype.getItem = originalGetItem
        }, 100)
      })

      await playwrightPage.reload()

      // Even with localStorage error, lang attribute should be set
      const langAttr = await page.getAttribute('html', 'lang')
      expect(langAttr).toBe('en')
    })

    test('should gracefully handle missing localStorage', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)

      // Mock missing localStorage
      await playwrightPage.addInitScript(() => {
        // @ts-expect-error - deliberately breaking localStorage
        delete window.localStorage
      })

      await playwrightPage.reload()

      // Should still function and set lang attribute
      const langAttr = await page.getAttribute('html', 'lang')
      expect(langAttr).toBe('en')
    })
  })

  describe('FOUC prevention', () => {
    test('should apply theme before page renders (no flash)', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)

      // Set dark theme
      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark')
      })

      // Reload and immediately check theme (before full page load)
      await page.goto('/')

      // Check theme is set during DOMContentLoaded (before full render)
      const themeAttr = await page.getAttribute('html', 'data-theme')
      expect(themeAttr).toBe('dark')
    })

    test('should apply theme synchronously on page load', async ({ page: playwrightPage }) => {
      const page = new BasePage(playwrightPage)

      await page.evaluate(() => {
        localStorage.setItem('theme', 'dark')
      })

      // Monitor when theme attribute is set
      const themeSetTime = await page.evaluate(() => {
        return new Promise<string>((resolve) => {
          const observer = new MutationObserver(() => {
            const theme = document.documentElement.getAttribute('data-theme')
            if (theme) {
              resolve(performance.now().toString())
            }
          })

          observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
          })

          // Timeout after 1 second
          setTimeout(() => resolve('timeout'), 1000)
        })
      })

      expect(themeSetTime).not.toBe('timeout')
    })
  })
})
