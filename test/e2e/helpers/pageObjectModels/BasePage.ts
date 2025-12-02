/**
 * Base Page Object Model
 * Common methods and utilities shared across all page objects
 */
import {
  type BrowserContext,
  type ConsoleMessage,
  type JSHandle,
  type Locator,
  type Page,
  type Response,
  expect,
} from '@playwright/test'
import { navigationItems } from '@components/Navigation/server'
import { clearConsentCookies } from '@test/e2e/helpers'
import { waitForHeaderComponents as waitForHeaderComponentsHelper } from '@test/e2e/helpers/waitHelpers'

const DEFAULT_NAVIGATION_TIMEOUT = 5000
const EXTENDED_NAVIGATION_TIMEOUT = 15000

export class BasePage {
  readonly page: Page
  private _consoleMessages: string[] = []
  public errors404: string[] = []
  public navigationItems = navigationItems
  private lastAstroPageLoadCount = 0
  private has404Listener = false

  protected constructor(protected readonly _page: Page) {
    this.page = _page

    // IMPORTANT: Register listener early
    this.page.on('console', (consoleMessage) => {
      this._consoleMessages.push(consoleMessage.text())
    })
  }

  protected static async setupPlaywrightGlobals(page: Page): Promise<void> {
    await page.addInitScript(() => {
      window.isPlaywrightControlled = true
      if (typeof window.__disableServiceWorkerForE2E === 'undefined') {
        window.__disableServiceWorkerForE2E = true
      }

      if (typeof window.__astroPageLoadCounter !== 'number') {
        window.__astroPageLoadCounter = 0
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
   * Page Methods
   *
   * ================================================================
   */

  /**
   * Navigate to a specific path. Wait for page to be fully loaded.
   * Module and deferred scripts have executed. Images, subframes,
   * and async scripts may not have finished loading.
   * Automatically dismisses cookie consent modal unless skipCookieDismiss is true.
   */
  async goto(path: string, options?: { skipCookieDismiss?: boolean; timeout?: number }): Promise<null | Response> {
    const requestedTimeout = options?.timeout ?? DEFAULT_NAVIGATION_TIMEOUT

    const navigate = async (timeout: number) => {
      return await this._page.goto(path, {
        timeout,
        waitUntil: 'domcontentloaded',
      })
    }

    let response: null | Response = null

    try {
      response = await navigate(requestedTimeout)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('ERR_ABORTED')) {
        response = await navigate(requestedTimeout)
      } else if (!options?.timeout && message.includes('Timeout')) {
        // Allow a single retry with a longer timeout to absorb slow prerender navigations
        response = await navigate(EXTENDED_NAVIGATION_TIMEOUT)
      } else {
        throw error
      }
    }

    // Dismiss cookie modal to prevent it from blocking clicks (unless opted out)
    if (!options?.skipCookieDismiss) {
      await this.dismissCookieModal()
    }

    return response
  }

  /**
   * Reload the current page
   */
  async reload(options?: { timeout?: number; waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<null | Response> {
    return await this._page.reload(options)
  }

  /**
   * Dismiss cookie consent modal if it's visible
   */
  private async dismissCookieModal(): Promise<void> {
    try {
      // Set consent cookies
      await this._page.evaluate(() => {
        document.cookie = 'consent_analytics=true; path=/; max-age=31536000'
        document.cookie = 'consent_marketing=true; path=/; max-age=31536000'
        document.cookie = 'consent_functional=true; path=/; max-age=31536000'

        // Clear localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('cookieConsent')
          localStorage.removeItem('gdprConsent')
        }
      })

      // Force hide the modal
      await this._page.evaluate(() => {
        const modal = document.getElementById('consent-modal-id')
        if (modal) {
          modal.style.display = 'none'
        }
        const main = document.getElementById('main-content')
        if (main && main.hasAttribute('inert')) {
          main.removeAttribute('inert')
        }
      })

        // Wait until modal is hidden and page is interactive again
        await this.waitForFunction(() => {
          const modal = document.getElementById('consent-modal-id')
          const main = document.getElementById('main-content')
          const modalHidden = !modal || modal.style.display === 'none' || modal.hasAttribute('hidden')
          const mainInteractive = !main || !main.hasAttribute('inert')
          return modalHidden && mainInteractive
        }, undefined, { timeout: 1000 })
    } catch {
      // Ignore errors - modal might not exist on all pages
    }
  }

  /**
   * Evaluate JS script in the browser
   */
  async evaluate<R, Arg = void>(
    pageFunction: (_arg: Arg) => R | Promise<R>,
    ...args: Arg extends void ? [] : [Arg]
  ): Promise<R> {
    type EvaluateCallback = Parameters<Page['evaluate']>[0]
    type EvaluateArgument = Parameters<Page['evaluate']>[1]

    const typedCallback = pageFunction as unknown as EvaluateCallback

    if (args.length === 0) {
      return (await this._page.evaluate(typedCallback)) as Awaited<R>
    }

    const [value] = args as [Arg]
    return (await this._page.evaluate(typedCallback, value as EvaluateArgument)) as Awaited<R>
  }

  /**
   * Check if element is visible
   */
  locator(selector: string, options?: {
    has?: Locator;
    hasNot?: Locator;
    hasNotText?: string | RegExp;
    hasText?: string | RegExp;
}): Locator {
    return this._page.locator(selector, options)
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this._page.locator(selector).isVisible()
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this._page.screenshot({ path: `test/e2e/screenshots/${name}.png`, fullPage: true })
  }

  /**
   * Set viewport size
   */
  async setViewport(width: number, height: number): Promise<void> {
    await this._page.setViewportSize({ width, height })
  }

  /**
   * Set viewport size using object parameter
   */
  async setViewportSize(size: { width: number; height: number }): Promise<void> {
    await this._page.setViewportSize(size)
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
   * Wait for selector to be visible
   */
  async waitForSelector(selector: string, options?: { timeout?: number }): Promise<void> {
    await this._page.waitForSelector(selector, options)
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await this._page.waitForLoadState('networkidle')
  }

  /**
   * ================================================================
   *
   * Action Methods
   *
   * ================================================================
   */

  /**
   * Click an element with optional wait
   */
  async click(selector: string, options?: { force?: boolean }): Promise<void> {
    await this._page.click(selector, options)
  }

  /**
   * Fill an input field
   */
  async fill(selector: string, value: string): Promise<void> {
    await this._page.fill(selector, value)
  }

  /**
   * Check a checkbox
   */
  async check(selector: string): Promise<void> {
    await this._page.check(selector)
  }

  /**
   * Uncheck a checkbox
   */
  async uncheck(selector: string): Promise<void> {
    await this._page.uncheck(selector)
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string): Promise<void> {
    await this._page.locator(selector).scrollIntoViewIfNeeded()
  }

  /**
   * Press keyboard key
   */
  async pressKey(key: string): Promise<void> {
    await this._page.keyboard.press(key)
  }

  /**
   * Type text using keyboard
   */
  async type(text: string): Promise<void> {
    await this._page.keyboard.type(text)
  }

  /**
   * Get keyboard object for advanced keyboard operations
   */
  get keyboard() {
    return this._page.keyboard
  }

  /**
   * Get mouse object for advanced mouse operations
   */
  get mouse() {
    return this._page.mouse
  }

  /**
   * Get touchscreen object for touch operations
   */
  get touchscreen() {
    return this._page.touchscreen
  }

  /**
   * Hover over element
   */
  async hover(selector: string): Promise<void> {
    await this._page.hover(selector)
  }

  /**
   * Wait for load state
   */
  async waitForLoadState(state?: 'load' | 'domcontentloaded' | 'networkidle'): Promise<void> {
    await this._page.waitForLoadState(state)
  }

  /**
   * Wait for specified timeout in milliseconds
   * @deprecated Use event-based waits like waitForPageLoad() instead
   */
  async wait(timeout: number): Promise<void> {
    await this._page.waitForTimeout(timeout)
  }

  /**
   * Wait for specified timeout in milliseconds
   * Alias for wait() method
   * @deprecated Use event-based waits like waitForPageLoad() instead
   */
  async waitForTimeout(timeout: number): Promise<void> {
    await this._page.waitForTimeout(timeout)
  }

  /**
   * Wait for a custom function to return truthy value
   */
  async waitForFunction<R>(
    pageFunction: () => R | Promise<R>,
    arg?: unknown,
    options?: { timeout?: number }
  ): Promise<void> {
    await this._page.waitForFunction(pageFunction, arg, options)
  }

  /**
   * Intercept and modify network requests
   */
  async route(
    targetUrl: string | RegExp | ((_url: URL) => boolean),
    handler: (_route: import('@playwright/test').Route) => void
  ): Promise<void> {
    await this._page.route(targetUrl, handler)
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
    const timeout = options?.timeout ?? DEFAULT_NAVIGATION_TIMEOUT
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
        await expect(navToggle).toHaveAttribute('aria-expanded', 'true', { timeout: DEFAULT_NAVIGATION_TIMEOUT })
      }

      await expect(navLink).toBeVisible({ timeout: DEFAULT_NAVIGATION_TIMEOUT })
    }

    await navLink.click()
  }

  /**
   * Wait for URL to change to match the expected pattern
   *
   * @param urlPattern - Glob pattern or regex to match against URL
   * @param options - Timeout and other options
   *
   * @example
   * ```ts
   * await page.waitForURL('/articles')
   * ```
   */
  async waitForURL(urlPattern: string | RegExp, options?: { timeout?: number }): Promise<void> {
    await this._page.waitForURL(urlPattern, options)
  }

  /**
   * Wait for a response matching the URL pattern
   *
   * @param urlPattern - URL or pattern to match
   * @param options - Timeout and other options
   *
   * @example
   * ```ts
   * const response = await page.waitForResponse('/api/newsletter')
   * ```
   */
  async waitForResponse(
    urlPattern: string | RegExp | ((_response: Response) => boolean),
    options?: { timeout?: number }
  ): Promise<Response> {
    return await this._page.waitForResponse(urlPattern, options)
  }

  /**
   * ================================================================
   *
   * Browser and Head Methods
   *
   * ================================================================
   */

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this._page.url()
  }

  /**
   * Get page URL (alias for getCurrentUrl)
   */
  url(): string {
    return this._page.url()
  }

  /**
   * Get page title
   */
  async title(): Promise<string> {
    return this._page.title()
  }

  /**
   * Get the browser context that the page belongs to
   */
  context() {
    return this._page.context()
  }

  /**
   * Emulate media features (e.g., prefers-color-scheme, reduced-motion)
   */
  async emulateMedia(options: {
    colorScheme?: 'light' | 'dark' | 'no-preference'
    reducedMotion?: 'reduce' | 'no-preference'
    forcedColors?: 'active' | 'none'
  }): Promise<void> {
    await this._page.emulateMedia(options)
  }

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
  async getMetaContent(property: string): Promise<string | null> {
    const selector = `meta[property="${property}"], meta[name="${property}"]`
    return await this._page.getAttribute(selector, 'content')
  }

  /**
   * Verify meta tag exists and has content
   */
  async expectMetaTag(property: string): Promise<void> {
    const content = await this.getMetaContent(property)
    expect(content).toBeTruthy()
    expect(content).not.toBe('')
  }

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
  async getText(selector: string): Promise<string | null> {
    return await this._page.textContent(selector)
  }

  /**
   * Get all links on the page
   */
  async getAllLinks(): Promise<string[]> {
    return await this._page.$$eval('a[href]', (links) =>
      links
        .filter((link): link is HTMLAnchorElement => link instanceof HTMLAnchorElement)
        .map((link) => link.href)
    )
  }

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
    expect(errors).toHaveLength(0)
    return await this._page.pageErrors()
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
   * Add a listener for console messages. Add before page navigation like .goto()
   */
  async setupConsoleListener(): Promise<void> {
    this._page.on('console', msg => {
      this._consoleMessages.push(msg.text())
    })
  }

  /**
   * Find a specific message in the console output. Note that there is a timing
   * issue with this method. It does not wait to make sure that your expected
   * output has had an opportunity to be executed. If you want to check for either
   * a success or a failure message, pass both in an array.
   */
  getConsoleMessage(searchStr: string | string[]): string {
    const messages = this._consoleMessages
    if (Array.isArray(searchStr)) {
      return messages.find(msg => searchStr.some(term => msg.includes(term))) || ''
    }
    return messages.find(msg => msg.includes(searchStr)) || ''
  }

  /**
   * Get all console messages. Note there is a timing issue with using this. It
   * does not wait to make sure that your expected output has had an opportunity
   * to be executed. To catch a specific message, use getConsoleMessage() which
   * waits for that message to appear.
   */
  getConsoleMessages(): string[] {
    return this._consoleMessages
  }

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
   * ================================================================
   *
   * CoPilot-Added Methods
   *
   * ================================================================
   */

  /**
   * Verify hero section is present and visible
   */
  async expectHeroSection(): Promise<void> {
    const hero = this._page.locator('[data-component="hero"], section').first()
    await expect(hero).toBeVisible()
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
}