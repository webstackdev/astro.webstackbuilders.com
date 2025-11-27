/**
 * Nanostore Persistence Tests
 * Tests that all stores persist their values across page navigations (View Transitions)
 * @see src/components/scripts/store/
 */

import { BasePage, test, expect } from '@test/e2e/helpers'
import { selectTheme } from '@test/e2e/helpers/cookieHelper'

const getLocalStorageItem = (page: BasePage, key: string) => {
  return page.evaluate((storageKey) => localStorage.getItem(storageKey), key)
}

const disableConsentModal = async (page: BasePage) => {
  await page.evaluate(() => {
    const modal = document.getElementById('consent-modal-id')
    if (modal) {
      modal.style.display = 'none'
      modal.setAttribute('aria-hidden', 'true')
    }

    const main = document.getElementById('main-content')
    if (main && main.hasAttribute('inert')) {
      main.removeAttribute('inert')
    }
  })
}

const gotoWithoutGrantingConsent = async (page: BasePage, path = '/') => {
  await page.goto(path, { skipCookieDismiss: true })
  await disableConsentModal(page)
}

const navigateWithViewTransitions = async (page: BasePage, href: string) => {
  const navigationElement = page.locator('site-navigation')
  await expect(navigationElement).toHaveAttribute('data-nav-ready', 'true')

  const mobileToggle = page.locator('#header__nav-icon button')
  if (await mobileToggle.isVisible()) {
    await mobileToggle.click()
    await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true')
  }

  await page.navigateToPage(href)
  await page.waitForPageLoad()
}

test.describe('Nanostore Persistence Across Navigation', () => {
  /**
   * Setup for nanostore persistence tests
   *
   * Side effects relied upon:
   * - Clears all storage (localStorage, sessionStorage, cookies) to ensure clean state
   * - Reloads page after clearing storage to re-initialize nanostores with empty state
   * - Waits for networkidle to ensure stores and components are fully initialized
   *
   * Without this setup, tests would fail due to:
   * - Stores containing values from previous tests, causing false positives/negatives
   * - Persistence mechanisms reading stale data from storage
   * - Race conditions where stores haven't finished initializing before tests run
   *
   * This ensures each test starts with a known baseline (empty stores) to verify
   * persistence behavior across View Transitions navigation
   */
  test.beforeEach(async ({ page: playwrightPage, context }) => {
    const page = await BasePage.init(playwrightPage)
    // Clear ALL storage (localStorage, sessionStorage, AND cookies) for clean state
    await context.clearCookies()
    await gotoWithoutGrantingConsent(page)
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await context.clearCookies()
    // Reload page so stores re-initialize with cleared storage
    await page.reload()
    await page.waitForLoadState('networkidle')
    await disableConsentModal(page)
  })

  test('@ready theme preference persists across View Transitions', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Go to homepage
    await gotoWithoutGrantingConsent(page)
    await page.waitForLoadState('networkidle')

    // Select dark theme using helper
    await selectTheme(page.page, 'dark')

    // Verify theme is applied
    const htmlElement = page.locator('html')
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark')

    // Wait for localStorage to be updated (nanostores persistence is async)
    await expect.poll(async () => {
      return await getLocalStorageItem(page, 'theme')
    }).toBe('dark')
    let storedTheme = await getLocalStorageItem(page, 'theme')
    expect(storedTheme).toBe('dark')

    // Navigate to another page using View Transitions
    await navigateWithViewTransitions(page, '/about')

    // Verify theme persisted after navigation
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark')

    // Verify localStorage still has the theme stored
    storedTheme = await getLocalStorageItem(page, 'theme')
    expect(storedTheme).toBe('dark')
  })

  test('@ready theme picker modal state persists across View Transitions', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Go to homepage
    await gotoWithoutGrantingConsent(page)
    await page.waitForLoadState('networkidle')

    // Open theme picker modal
    const themeToggle = page.locator('[data-theme-toggle]')
    await themeToggle.click()

    // Verify modal is open
    const modal = page.locator('[data-theme-modal]')
    await expect(modal).toHaveClass(/is-open/)

    // Navigate to another page while modal is open
    await navigateWithViewTransitions(page, '/about')

    // Modal should remain open after navigation (state persists via $themePickerOpen store)
    const modalAfterNav = page.locator('[data-theme-modal]')
    await expect(modalAfterNav).toHaveClass(/is-open/)

    // Verify modal state persisted in localStorage
    const isOpen = await page.evaluate(() => localStorage.getItem('themePickerOpen'))
    expect(isOpen).toBe('true')
  })

  test('@ready cookie consent preferences persist across View Transitions', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Go to homepage
    await gotoWithoutGrantingConsent(page)
    await page.waitForLoadState('networkidle')

    // Accept functional consent
    const consentHelpersAvailable = await page.evaluate(() => {
      if (!window.updateConsent) {
        return false
      }
      window.updateConsent('functional', true)
      window.updateConsent('analytics', true)
      return true
    })
    expect(consentHelpersAvailable).toBe(true)
    await expect.poll(async () => {
      return await getLocalStorageItem(page, 'cookieConsent')
    }).not.toBeNull()

    // Verify consent is stored in localStorage
    let storedConsent = await getLocalStorageItem(page, 'cookieConsent')
    expect(storedConsent).toBeTruthy()
    if (storedConsent) {
      const consent = JSON.parse(storedConsent)
      expect(consent.functional).toBe(true)
      expect(consent.analytics).toBe(true)
    }

    // Navigate to another page
    await navigateWithViewTransitions(page, '/about')

    await expect.poll(async () => {
      return await getLocalStorageItem(page, 'cookieConsent')
    }).not.toBeNull()

    // Verify consent persisted after navigation
    storedConsent = await getLocalStorageItem(page, 'cookieConsent')
    expect(storedConsent).toBeTruthy()
    if (storedConsent) {
      const consent = JSON.parse(storedConsent)
      expect(consent.functional).toBe(true)
      expect(consent.analytics).toBe(true)
    }
  })

  test('@ready social embed cache persists across View Transitions', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Go to a page with social embeds (if available)
    await gotoWithoutGrantingConsent(page)
    await page.waitForLoadState('networkidle')

    // First enable functional consent (required for caching)
    const functionalConsentApplied = await page.evaluate(() => {
      if (!window.updateConsent) {
        return false
      }
      window.updateConsent('functional', true)
      return true
    })
    expect(functionalConsentApplied).toBe(true)
    await expect.poll(async () => {
      return await getLocalStorageItem(page, 'cookieConsent')
    }).not.toBeNull()

    // Add a mock embed to the cache
    const cacheHelpersAvailable = await page.evaluate(() => {
      if (!window.cacheEmbed) {
        return false
      }
      const testData = { html: '<blockquote>Test cached embed</blockquote>' }
      window.cacheEmbed('test_embed_123', testData, 24 * 60 * 60 * 1000) // 24 hours
      return true
    })
    expect(cacheHelpersAvailable).toBe(true)
    await expect.poll(async () => {
      return await getLocalStorageItem(page, 'socialEmbedCache')
    }).not.toBeNull()

    // Verify cache is stored in localStorage
    let storedCache = await getLocalStorageItem(page, 'socialEmbedCache')
    expect(storedCache).toBeTruthy()
    if (storedCache) {
      const cache = JSON.parse(storedCache)
      expect(cache.test_embed_123).toBeDefined()
      expect(cache.test_embed_123.data.html).toContain('Test cached embed')
    }

    // Navigate to another page
    await navigateWithViewTransitions(page, '/about')

    // Verify cache persisted after navigation
    await expect.poll(async () => {
      return await getLocalStorageItem(page, 'socialEmbedCache')
    }).not.toBeNull()

    storedCache = await getLocalStorageItem(page, 'socialEmbedCache')
    expect(storedCache).toBeTruthy()
    if (storedCache) {
      const cache = JSON.parse(storedCache)
      expect(cache.test_embed_123).toBeDefined()
      expect(cache.test_embed_123.data.html).toContain('Test cached embed')
    }
  })

  test('@ready mastodon instances persist across View Transitions', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Go to homepage
    await gotoWithoutGrantingConsent(page)
    await page.waitForLoadState('networkidle')

    // First enable functional consent (required for persistence)
    const functionalConsentEnabled = await page.evaluate(() => {
      if (!window.updateConsent) {
        return false
      }
      window.updateConsent('functional', true)
      return true
    })
    expect(functionalConsentEnabled).toBe(true)
    await expect.poll(async () => {
      return await getLocalStorageItem(page, 'cookieConsent')
    }).not.toBeNull()

    // Add mastodon instances
    const mastodonHelpersAvailable = await page.evaluate(() => {
      if (!window.saveMastodonInstance) {
        return false
      }
      window.saveMastodonInstance('mastodon.social')
      window.saveMastodonInstance('fosstodon.org')
      return true
    })
    expect(mastodonHelpersAvailable).toBe(true)
    await expect.poll(async () => {
      return await getLocalStorageItem(page, 'mastodonInstances')
    }).not.toBeNull()

    // Verify instances are stored in localStorage
    let storedInstances = await getLocalStorageItem(page, 'mastodonInstances')
    expect(storedInstances).toBeTruthy()
    if (storedInstances) {
      const instances = JSON.parse(storedInstances)
      expect(instances).toContain('mastodon.social')
      expect(instances).toContain('fosstodon.org')
    }

    // Navigate to another page
    await navigateWithViewTransitions(page, '/about')

    // Verify instances persisted after navigation
    await expect.poll(async () => {
      return await getLocalStorageItem(page, 'mastodonInstances')
    }).not.toBeNull()

    storedInstances = await getLocalStorageItem(page, 'mastodonInstances')
    expect(storedInstances).toBeTruthy()
    if (storedInstances) {
      const instances = JSON.parse(storedInstances)
      expect(instances).toContain('mastodon.social')
      expect(instances).toContain('fosstodon.org')
    }
  })

  test('@ready all stores clear on explicit storage clear', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Go to homepage and set up all stores
    await gotoWithoutGrantingConsent(page)
    await page.waitForLoadState('networkidle')

    // Set theme
    const themeToggle = page.locator('[data-theme-toggle]')
    await themeToggle.click()
    const darkThemeButton = page.locator('[data-theme="dark"]')
    await expect(darkThemeButton).toBeVisible()
    await darkThemeButton.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    // Set consent
    const consentSet = await page.evaluate(() => {
      if (!window.updateConsent) {
        return false
      }
      window.updateConsent('functional', true)
      return true
    })
    expect(consentSet).toBe(true)
    await expect.poll(async () => {
      return await getLocalStorageItem(page, 'cookieConsent')
    }).not.toBeNull()

    // Verify stores have data
    let theme = await page.evaluate(() => localStorage.getItem('theme'))
    let consent = await page.evaluate(() => localStorage.getItem('cookieConsent'))
    expect(theme).toBeTruthy()
    expect(consent).toBeTruthy()

    // Clear storage
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // Verify stores are cleared
    theme = await page.evaluate(() => localStorage.getItem('theme'))
    consent = await page.evaluate(() => localStorage.getItem('cookieConsent'))
    expect(theme).toBeNull()
    expect(consent).toBeNull()
  })

  test('@ready stores restore defaults when localStorage is corrupted', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    // Go to homepage
    await gotoWithoutGrantingConsent(page)
    await page.waitForLoadState('networkidle')

    // Corrupt localStorage entries
    await page.evaluate(() => {
      localStorage.setItem('theme', 'invalid-json-{[}')
      localStorage.setItem('cookieConsent', 'not-valid-json')
    })

    // Reload page to trigger store initialization
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect.poll(async () => {
      return await getLocalStorageItem(page, 'theme')
    }).toBe('light')

    // Verify stores recovered with defaults
    const theme = await getLocalStorageItem(page, 'theme')
    await expect.poll(async () => {
      return await getLocalStorageItem(page, 'cookieConsent')
    }).not.toBeNull()
    const consent = await getLocalStorageItem(page, 'cookieConsent')

    // Theme should be reset to default
    expect(theme).toBe('light')

    // Consent should be reset with defaults (functional defaults to false - opt-in for Mastodon)
    if (consent) {
      const consentObj = JSON.parse(consent)
      expect(consentObj.analytics).toBe(false)
      expect(consentObj.functional).toBe(false)
    }
  })
})
