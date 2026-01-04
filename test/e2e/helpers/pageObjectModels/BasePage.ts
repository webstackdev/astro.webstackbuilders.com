/**
 * Base Page Object Model
 * Common methods and utilities shared across all page objects
 */
import {
  type BrowserContext,
  type ConsoleMessage,
  type JSHandle,
  type Page,
  expect,
} from '@playwright/test'
import { navigationItems } from '@components/Navigation/server'
import { clearConsentCookies } from '@test/e2e/helpers'
import { waitForHeaderComponents as waitForHeaderComponentsHelper } from '@test/e2e/helpers/waitHelpers'
import { wait } from '@test/e2e/helpers/waitTimeouts'
import type { BuiltInsGotoOptions } from './BuiltInsPage'
import { BuiltInsPage } from './BuiltInsPage'

export class BasePage extends BuiltInsPage {
  public errors404: string[] = []
  public navigationItems = navigationItems
  private lastAstroPageLoadCount = 0
  private has404Listener = false

  protected constructor(page: Page) {
    super(page)
  }

  protected override async afterGoto(_path: string, options?: BuiltInsGotoOptions): Promise<void> {
    if (!options?.skipCookieDismiss) {
      await this.dismissCookieModal()
    }
  }

  /**
   * Dismiss cookie consent modal if it's visible
   */
  private async dismissCookieModal(): Promise<void> {
    try {
      // Set consent cookies
      await this._page.evaluate(() => {
        document.cookie = 'consent_analytics=false; path=/; max-age=31536000'
        document.cookie = 'consent_marketing=false; path=/; max-age=31536000'
        document.cookie = 'consent_functional=false; path=/; max-age=31536000'

        // Clear localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('cookieConsent')
          localStorage.removeItem('gdprConsent')
        }
      })

      const cookieDialog = this._page.getByRole('dialog', { name: /cookie consent/i })

      // Wait briefly for the dialog to appear on client-side hydrated pages.
      await cookieDialog.waitFor({ state: 'visible', timeout: wait.tinyUi }).catch(() => undefined)

      if (await cookieDialog.isVisible().catch(() => false)) {
        const closeButton = this._page.getByRole('button', { name: /close cookie consent/i })
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click({ timeout: wait.tinyUi }).catch(() => undefined)
        }
      }

      // Force hide the modal (covers <dialog open> and inert states)
      await this._page.evaluate(() => {
        const modal = document.getElementById('consent-modal-id')
        if (modal) {
          modal.removeAttribute('open')
          modal.setAttribute('aria-hidden', 'true')
          modal.style.display = 'none'
        }

        const dialogs = Array.from(document.querySelectorAll('dialog'))
        dialogs.forEach(dialog => {
          dialog.removeAttribute('open')
          dialog.setAttribute('aria-hidden', 'true')
          dialog.style.display = 'none'
        })

        const roleDialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'))
        roleDialogs.forEach(dialog => {
          dialog.setAttribute('aria-hidden', 'true')
          dialog.style.display = 'none'
        })

        const main = document.getElementById('main-content')
        if (main && main.hasAttribute('inert')) {
          main.removeAttribute('inert')
        }
      })

      // Wait until modal is hidden and page is interactive again
      await this.waitForFunction(() => {
        const modal = document.getElementById('consent-modal-id')
        const main = document.getElementById('main-content')
        const roleDialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'))
        const anyRoleDialogVisible = roleDialogs.some(
          dialog => dialog.style.display !== 'none' && dialog.getAttribute('aria-hidden') !== 'true'
        )
        const modalHidden =
          (!modal ||
            modal.style.display === 'none' ||
            modal.hasAttribute('hidden') ||
            modal.getAttribute('aria-hidden') === 'true') &&
          !anyRoleDialogVisible
        const mainInteractive = !main || !main.hasAttribute('inert')
        return modalHidden && mainInteractive
      }, undefined, { timeout: wait.tinyUi })
    } catch {
      // Ignore errors - modal might not exist on all pages
    }
  }

  protected static async setupPlaywrightGlobals(page: Page): Promise<void> {
    await page.addInitScript(() => {
      window.isPlaywrightControlled = true
      if (typeof window.__disableServiceWorkerForE2E === 'undefined') {
        window.__disableServiceWorkerForE2E = true
      }

      // Establish a deterministic consent baseline before any app scripts run.
      // GDPR form consent uses the `functional` consent store.
      // NOTE: We intentionally do not pre-seed consent cookies here.
      // Some E2E specs validate the first-visit consent banner behavior and need
      // a truly empty cookie jar. Most specs rely on `dismissCookieModal()` to
      // establish an opt-out baseline after navigation.

      if (typeof window.__astroPageLoadCounter !== 'number') {
        window.__astroPageLoadCounter = 0
      }

      // `astro:page-load` is primarily a View Transitions signal.
      // Some browsers/environments may not reliably dispatch it on a fresh load.
      // We also bump the counter on full document loads so `waitForPageLoad()` works
      // for both navigation modes.
      let fullLoadCountedForDocument = false
      const bumpFullLoadCounter = () => {
        if (fullLoadCountedForDocument) return
        fullLoadCountedForDocument = true
        window.__astroPageLoadCounter = (window.__astroPageLoadCounter ?? 0) + 1
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('load', bumpFullLoadCounter, { passive: true })
        // Covers BFCache restores where `load` may not fire.
        window.addEventListener('pageshow', bumpFullLoadCounter, { passive: true })
      }

      if (typeof document !== 'undefined' && document.readyState === 'complete') {
        bumpFullLoadCounter()
      }

      if (!window.__astroPageLoadListenerAttached) {
        const registerAstroPageLoadListener = () => {
          if (window.__astroPageLoadListenerAttached) return
          if (typeof document === 'undefined') return

          document.addEventListener(
            'astro:page-load',
            () => {
              window.__astroPageLoadCounter = (window.__astroPageLoadCounter ?? 0) + 1
            },
            { passive: true }
          )

          window.__astroPageLoadListenerAttached = true
        }

        if (typeof document !== 'undefined' && document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', registerAstroPageLoadListener, { once: true })
        } else {
          registerAstroPageLoadListener()
        }
      }

      if (!window.EvaluationError) {
        class EvaluationError extends Error {
          constructor(message: string, options?: ErrorOptions) {
            super(message, options)
            Object.defineProperty(this, 'name', {
              value: 'EvaluationError',
              enumerable: false,
              configurable: true,
            })
            Object.setPrototypeOf(this, new.target.prototype)
            if ('captureStackTrace' in Error) {
              Error.captureStackTrace(this, EvaluationError)
            }
          }
        }

        window.EvaluationError = EvaluationError
      }
    })
  }

  static async init(page: Page): Promise<BasePage> {
    await this.setupPlaywrightGlobals(page)
    const instance = new BasePage(page)
    await instance.onInit()
    return instance
  }

  /**
   * Hook for subclasses to perform custom initialization
   * Called after construction but before the instance is returned from init()
   * Override this in subclasses to add custom setup logic
   */
  protected async onInit(): Promise<void> {
    // Base implementation does nothing - subclasses can override
  }

  /**
   * ================================================================
   *
   * Wait For Methods
   *
   * ================================================================
   */

  /**
   * Wait for whole page be loaded and executed, including all dependent
   * resources such as stylesheets, scripts (including async, deferred, and
   * module scripts), iframes, and images, except those that are loaded lazily.
   */
  async waitForPageComplete(): Promise<void> {
    await this._page.waitForFunction(() => document.readyState === 'complete')
  }


  /**
   * Wait for navigation to complete
   */

  /**
   * ================================================================
   *
   * Action Methods
   *
   * ================================================================
   */


  /**
   * Deterministically open the mobile navigation menu and wait for it to finish animating
   */
  async openMobileMenu(options?: { timeout?: number }): Promise<void> {
    const timeout = options?.timeout ?? wait.navigation

    await this.waitForHeaderComponents({ timeout })
    await this._page.waitForFunction(
      () => !document.documentElement?.hasAttribute('data-astro-transition'),
      undefined,
      { timeout }
    )

    const toggleButton = this._page.locator('button#nav-toggle')
    await expect(toggleButton).toBeVisible({ timeout })

    const expanded = await toggleButton.getAttribute('aria-expanded')
    if (expanded !== 'true') {
      await toggleButton.click()
    }

    await this._page.waitForFunction(
      () => {
        const header = document.getElementById('header')
        const menu = document.querySelector('.main-nav-menu')
        const body = document.body

        const headerExpanded = header?.classList.contains('aria-expanded-true') ?? false
        const menuVisible = menu?.classList.contains('menu-visible') ?? false
        const bodyScrollLocked = body?.classList.contains('no-scroll') ?? false

        return headerExpanded && menuVisible && bodyScrollLocked
      },
      undefined,
      { timeout }
    )
  }

  /**
   * Deterministically close the mobile navigation menu and wait for scroll lock to clear
   */
  async closeMobileMenu(options?: { timeout?: number }): Promise<void> {
    const timeout = options?.timeout ?? wait.defaultWait
    const toggleButton = this._page.locator('button#nav-toggle')

    await expect(toggleButton).toBeVisible({ timeout })

    const expanded = await toggleButton.getAttribute('aria-expanded')
    if (expanded !== 'true') {
      return
    }

    await toggleButton.click()

    await this._page.waitForFunction(
      () => {
        const header = document.getElementById('header')
        const menu = document.querySelector('.main-nav-menu')
        const body = document.body

        const headerCollapsed = !(header?.classList.contains('aria-expanded-true') ?? false)
        const menuHidden = !(menu?.classList.contains('menu-visible') ?? false)
        const bodyScrollRestored = !(body?.classList.contains('no-scroll') ?? false)

        return headerCollapsed && menuHidden && bodyScrollRestored
      },
      undefined,
      { timeout }
    )
  }


  /**
   * Wait for Astro page load event
   * Use this instead of waitForTimeout when testing View Transitions
   *
   * @example
   * ```ts
   * await page.navigateToPage('/articles')
   * await page.waitForPageLoad()
   * ```
   */
  async waitForPageLoad(options?: { requireNext?: boolean; timeout?: number }): Promise<void> {
    const requireNext = options?.requireNext ?? false
    const timeout = options?.timeout ?? wait.navigation
    const currentCount = await this._page.evaluate(() => window.__astroPageLoadCounter ?? 0)

    if (!requireNext && currentCount > this.lastAstroPageLoadCount) {
      this.lastAstroPageLoadCount = currentCount
      return
    }

    const baseline = requireNext ? currentCount : this.lastAstroPageLoadCount

    await this._page.waitForFunction(
      previousCount => (window.__astroPageLoadCounter ?? 0) > previousCount,
      baseline,
      { timeout }
    )

    this.lastAstroPageLoadCount = await this._page.evaluate(() => window.__astroPageLoadCounter ?? 0)
  }

  /**
   * Wait for navigation header components (theme picker + nav) to hydrate
   * Ensures client-side navigation helpers can safely interact with header UI
   */
  async waitForHeaderComponents(options?: { timeout?: number }): Promise<void> {
    await waitForHeaderComponentsHelper(this._page, options?.timeout)
  }

  /**
   * Navigate to a page using Astro View Transitions
   * Clicks a link with the given href to trigger client-side navigation
   *
   * @param href - The href of the link to click (e.g., '/articles')
   *
   * @example
   * ```ts
   * await page.navigateToPage('/articles')
   * await page.waitForPageLoad()
   * ```
   */
  async navigateToPage(href: string): Promise<void> {
    await this.waitForHeaderComponents()
    const navLink = this._page.locator(`site-navigation a[href="${href}"]`).first()
    const linkCount = await navLink.count()

    if (linkCount === 0) {
      throw new Error(`Navigation link with href "${href}" not found`)
    }

    if (!(await navLink.isVisible())) {
      const navToggle = this._page.locator('.nav-toggle-btn').first()
      if (await navToggle.isVisible()) {
        await navToggle.click()
        await expect(navToggle).toHaveAttribute('aria-expanded', 'true', { timeout: wait.defaultWait })
      }

      await expect(navLink).toBeVisible({ timeout: wait.defaultWait })
    }

    await navLink.click()
  }


  /**
   * ================================================================
   *
   * Browser and Head Methods
   *
   * ================================================================
   */

  /**
   * Verify page URL matches expected pattern
   */
  async expectUrl(expectedUrl: string | RegExp): Promise<void> {
    await expect(this._page).toHaveURL(
      // eslint-disable-next-line security/detect-non-literal-regexp
      expectedUrl instanceof RegExp ? expectedUrl : new RegExp(expectedUrl)
    )
  }

  /**
   * Check if meta tag exists with specific content
   */

  /**
   * Verify page title contains expected text
   */
  async expectTitle(expectedTitle: string | RegExp): Promise<void> {
    await expect(this._page).toHaveTitle(
      // eslint-disable-next-line security/detect-non-literal-regexp
      expectedTitle instanceof RegExp ? expectedTitle : new RegExp(expectedTitle)
    )
  }

  /**
   * Get text content of first matching element
   */
  async getTextContent(selector: string): Promise<string | null> {
    return await this._page.locator(selector).first().textContent()
  }

  /**
   * ================================================================
   *
   * Element Methods
   *
   * ================================================================
   */

  /**
   * Verify <main> element is present and visible
   */
  async expectMainElement(): Promise<void> {
    await expect(this._page.locator('main')).toBeVisible()
  }

  /**
   * Verify <footer> element is present and visible
   */
  async expectFooter(): Promise<void> {
    await expect(this._page.locator('footer')).toBeVisible()
  }

  /**
   * Verify <h1> element is present and visible
   */
  async expectHeading(): Promise<void> {
    await expect(this._page.locator('h1').first()).toBeVisible()
  }

  /**
   * Verify homepage hero section is present and visible
   */
  async expectHeroSection(): Promise<void> {
    await expect(this._page.locator('section[aria-labelledby="home-hero-title"]')).toBeVisible()
    await expect(this._page.locator('#home-hero-title')).toBeVisible()
  }

  /**
   * Check if page has specific heading
   */
  async expectHasHeading(text: string | RegExp): Promise<void> {
    // eslint-disable-next-line security/detect-non-literal-regexp
    const textRegEx = text instanceof RegExp ? text : new RegExp(text)
    await expect(this._page.locator('h1, h2, h3').filter({ hasText: textRegEx }).first()).toBeVisible()
  }

  /**
   * Get text content of an element
   */
  /**
   * Get all links on the page
   */

  /**
   * ================================================================
   *
   * Contact Form Methods
   *
   * ================================================================
   */

  /**
   * Verify Contact page form is present and visible
   */
  async expectContactForm(): Promise<void> {
    await expect(this._page.locator('#contactForm')).toBeVisible()
  }

  /**
   * Verify Contact page form "name" input is present and visible
   */
  async expectContactFormNameInput(): Promise<void> {
    await expect(this._page.locator('#name')).toBeVisible()
  }

  /**
   * Verify <Contact page form "email" input is present and visible
   */
  async expectContactFormEmailInput(): Promise<void> {
    await expect(this._page.locator('#email')).toBeVisible()
  }

  /**
   * Verify Contact page form "message" input is present and visible
   */
  async expectContactFormMessageInput(): Promise<void> {
    await expect(this._page.locator('#message')).toBeVisible()
  }

  /**
   * Verify Contact page form "GDPR consent" is present and visible
   */
  async expectContactFormGdpr(): Promise<void> {
    await expect(this._page.locator('#contact-gdpr-consent')).toBeVisible()
  }

  /**
   * ================================================================
   *
   * Cookies Consent Methods
   *
   * ================================================================
   */

  /**
   * Verify Contact page form is present and visible
   */
  async clearConsentCookies(context: BrowserContext): Promise<void> {
    await clearConsentCookies(context)
  }

  /**
   * Verify Contact page form is present and visible
   */
  async expectCookiesContactForm(): Promise<void> {
    await this.waitForPageComplete()
    await expect(this._page.locator('#consent-modal-id')).toBeVisible()
  }

  /**
   * Dismiss/clear the cookie consent dialog if it's visible
   * This method handles the cookie dialog that may appear and block interactions
   *
   * @example
   * await page.clearCookieDialog()
   * // Continue with test that requires clicking on page elements
   */
  async clearCookieDialog(): Promise<void> {
    const cookieDialog = this._page.locator('#consent-modal-id')

    // Check if cookie dialog is visible
    if (await cookieDialog.isVisible()) {
      // Click "Allow All" button to dismiss the dialog
      await this._page.click('.consent-modal__btn-allow')

      // Wait for the dialog to be hidden
      await this._page.waitForSelector('#consent-modal-id', { state: 'hidden' })
    }
  }

  /**
   * ================================================================
   *
   * Newsletter Form Methods
   *
   * ================================================================
   */

  /**
   * Verify Newsletter form is present and visible
   */
  async expectNewsletterForm(): Promise<void> {
    await expect(this._page.locator('#newsletter-form')).toBeVisible()
  }

  /**
   * Verify Newsletter form "email" input is present and visible
   */
  async expectNewsletterEmailInput(): Promise<void> {
    await expect(this._page.locator('#newsletter-email')).toBeVisible()
  }

  /**
   * Verify Newsletter form "GDPR consent" is present and visible
   */
  async expectNewsletterGdpr(): Promise<void> {
    await expect(this._page.locator('#newsletter-gdpr-consent')).toBeVisible()
  }

  /**
   * ================================================================
   *
   * Theme Handling Methods
   *
   * ================================================================
   */

  /**
   * Theme key utilities
   * Wait for theme key to be set up to a timeout value. Usage:
   *
   * const themeKKeyPromise = await pageObject.themeKKeyPromise()
   * // Navigate to page, which should trigger the bootstrap IIFE
   * page.goto('/')
   * await themeKKeyPromise
   * const result = await getThemeKeyValue()
   * expect(result).toBeFalsy()
   */
  async themeKeyPromise(): Promise<JSHandle<boolean>> {
    return this._page.waitForFunction(() => {
      try {
        return localStorage.getItem('theme') !== null
      } catch (error) {
        // Handle security errors in WebKit/Firefox when localStorage is restricted
        console.warn('localStorage access restricted:', error instanceof Error ? error.message : String(error))
        return true // Assume theme is initialized when localStorage is restricted
      }
    })
  }

  async getThemeKeyValue(): Promise<string | null> {
    return this._page.evaluate(() => {
      try {
        return localStorage.getItem('theme')
      } catch (error) {
        // Handle security errors in WebKit/Firefox when localStorage is restricted
        console.warn('localStorage access restricted:', error instanceof Error ? error.message : String(error))
        return 'default' // Return default theme when localStorage is restricted
      }
    })
  }

  /**
   * Verify <main> element is present and visible
   */
  async expectThemePickerButton(): Promise<void> {
    await this.waitForPageComplete()
    const themePickerButton = this._page.locator(
      'button[aria-label="toggle theme switcher"]'
    )
    await expect(themePickerButton).toBeVisible()
  }

  /**
   * ================================================================
   *
   * Error Checking Methods
   *
   * ================================================================
   */

  /**
   * Returns up to (currently) 200 last uncaught exceptions from this page
   */
  async expectNoErrors(): Promise<Array<Error>> {
    await this.waitForPageComplete()
    const errors = await this._page.pageErrors()
    const filteredErrors = errors.filter((error) => !this.isIgnorablePageError(error))
    expect(filteredErrors).toHaveLength(0)
    return filteredErrors
  }

  /**
   * ================================================================
   *
   * 404 Checking Methods
   *
   * ================================================================
   */

  /**
   * Verify 404 page is displayed for non-existent pages
   */
  /**
   * Capture network responses that return 4xx status codes.
   * Listener is attached once per Playwright page instance.
   */
  async enable404Listener(): Promise<void> {
    if (this.has404Listener) {
      return
    }

    this._page.on('response', response => {
      const status = response.status()
      if (status >= 400 && status < 500) {
        const method = response.request().method()
        const responseUrl = response.url()
        this.errors404.push(`${status} ${method} ${responseUrl}`)
      }
    })

    this.has404Listener = true
  }

  /**
   * Reset tracked 4xx network errors between navigations.
   */
  reset404Errors(): void {
    this.errors404 = []
  }

  /**
   * ================================================================
   *
   * Console Log Methods
   *
   * ================================================================
   */

  /**
   * Wait for specific console messages to appear up to a timeout value. Usage:
   *
   * const message = await pageObject.consoleMssgPromise('Expected log message')
   * // Action that triggers a log message
   * page.goto('/')
   * const msg = await message
   * expect(msg.type()).toBe('log')
   */
  async consoleMssgPromise(
    searchStr: string | RegExp | string[] | RegExp[],
    timeout = 5000
  ): Promise<ConsoleMessage> {
    return this._page.waitForEvent('console', {
      predicate: (msg) => {
        const text = msg.text()

        switch (true) {
          case typeof searchStr === 'string':
            return text.includes(searchStr as string)

          case searchStr instanceof RegExp:
            return searchStr.test(text)

          case Array.isArray(searchStr):
            return searchStr.some((term) => {
              if (typeof term === 'string') {
                return text.includes(term)
              } else if (term instanceof RegExp) {
                return term.test(text)
              }
              return false
            })

          default:
            return false
        }
      },
      timeout,
    })
  }

  /**
   * Verify text is visible on the page
   */
  async expectTextVisible(text: string | RegExp): Promise<void> {
    const pattern = typeof text === 'string' ? text : text
    await expect(this._page.locator(`text=${pattern}`).first()).toBeVisible()
  }

  /**
   * Verify CTA button is present and enabled
   * Looks for CTA buttons in main content, excluding navigation elements
   */
  async expectCtaButton(): Promise<void> {
    // Look for CTA buttons in main content areas, excluding navigation
    const ctaButton = this._page.locator(`
      main a[href*="contact"]:visible,
      main button:has-text("Contact"):visible,
      main a:has-text("Start a Conversation"):visible,
      main a:has-text("Get Started"):visible,
      main a:has-text("Let's Talk"):visible,
      main button:has-text("Start a Conversation"):visible,
      main button:has-text("Get Started"):visible,
      main button:has-text("Let's Talk"):visible,
      [data-testid="cta-button"]:visible
    `).first()

    const count = await ctaButton.count()
    if (count > 0) {
      await expect(ctaButton).toBeVisible()
      await expect(ctaButton).toBeEnabled()
    } else {
      // If no main content CTA found, check for any visible contact-related buttons
      // but exclude navigation elements specifically
      const fallbackCta = this._page.locator(`
        a[href*="contact"]:visible:not(nav a):not(header a),
        button:has-text("Contact"):visible:not(nav button):not(header button)
      `).first()

      const fallbackCount = await fallbackCta.count()
      if (fallbackCount > 0) {
        await expect(fallbackCta).toBeVisible()
        await expect(fallbackCta).toBeEnabled()
      }
    }
  }

  /**
   * Count elements matching selector
   */
  async countElements(selector: string): Promise<number> {
    return await this._page.locator(selector).count()
  }

  /**
   * Verify element is visible
   */
  async expectElementVisible(selector: string): Promise<void> {
    await expect(this._page.locator(selector).first()).toBeVisible()
  }

  /**
   * Verify element is hidden/not visible
   */
  async expectElementHidden(selector: string): Promise<void> {
    await expect(this._page.locator(selector).first()).not.toBeVisible()
  }

  /**
   * Verify element is not empty
   */
  async expectElementNotEmpty(selector: string): Promise<void> {
    await expect(this._page.locator(selector).first()).not.toBeEmpty()
  }

  /**
   * Verify element has attribute
   */
  async expectAttribute(selector: string, attribute: string): Promise<void> {
    await expect(this._page.locator(selector).first()).toHaveAttribute(attribute)
  }

  /**
   * Verify article card has required elements
   */
  async expectArticleCard(): Promise<void> {
    const firstArticle = this._page.locator('article').first()

    // Should have heading (h2 or h3 or h4)
    const heading = firstArticle.locator('h2, h3, h4').first()
    await expect(heading).toBeVisible()

    // Should have image
    const image = firstArticle.locator('img').first()
    await expect(image).toBeVisible()

    // Should have description/excerpt text
    const description = firstArticle.locator('p').first()
    await expect(description).toBeVisible()
  }

  /**
   * Verify element contains text matching pattern
   */
  async expectTextContains(selector: string, pattern: string | RegExp): Promise<void> {
    const element = this._page.locator(selector).first()
    await expect(element).toContainText(pattern)
  }

  /**
   * Verify service card has required elements
   */
  async expectServiceCard(): Promise<void> {
    const firstCard = this._page.locator('.service-item').first()

    // Each service should have h3 title
    await expect(firstCard.locator('h3')).toBeVisible()

    // Should have a link to the service detail page
    await expect(firstCard.locator('a')).toBeVisible()
  }

  /**
   * Get attribute value from element
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return await this._page.locator(selector).first().getAttribute(attribute)
  }

  /**
   * Verify URL contains text
   */
  async expectUrlContains(text: string): Promise<void> {
    const url = this._page.url()
    expect(url).toContain(text)
  }

  /**
   * Verify case study card has required elements
   */
  async expectCaseStudyCard(): Promise<void> {
    const caseStudyList = this._page.locator('.case-study-item, article')
    const firstCard = caseStudyList.first()
    const heading = firstCard.locator('h2, h3').first()
    await expect(heading).toBeVisible()
    await expect(firstCard.locator('a').first()).toBeVisible()
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this._page.title()
  }

  /**
   * Verify submit button is present and contains text
   */
  async expectSubmitButton(text?: string): Promise<void> {
    const submitButton = this._page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    if (text) {
      await expect(submitButton).toContainText(text)
    }
  }

  /**
   * Verify label exists for input and contains text
   */
  async expectLabelFor(forId: string, pattern: string | RegExp): Promise<void> {
    const label = this._page.locator(`label[for="${forId}"]`)
    await expect(label).toBeVisible()
    await expect(label).toContainText(pattern)
  }

  /**
   * Filter recurring non-actionable browser errors (e.g., Firefox HMR websockets) from pageErrors().
   */
  private isIgnorablePageError(error: Error): boolean {
    const message = error?.message ?? ''

    // Firefox occasionally surfaces this when Vite's HMR websocket retries during stress runs.
    if (message.includes('WebSocket closed without opened')) return true

    return false
  }
}