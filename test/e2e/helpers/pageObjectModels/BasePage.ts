/**
 * Base Page Object Model
 * Common methods and utilities shared across all page objects
 */
import {
  type BrowserContext,
  type ConsoleMessage,
  type JSHandle,
  type Page,
  type Response,
  expect
} from '@playwright/test'
import { navigationItems } from '@components/Navigation/server'
import { clearConsentCookies } from '@test/e2e/helpers'

export class BasePage {
  readonly page: Page
  private _consoleMessages: string[] = []
  public errors404: string[] = []
  public navigationItems = navigationItems

  constructor(protected readonly _page: Page) {
    this.page = _page

    // IMPORTANT: Register listener early
    this.page.on('console', (consoleMessage) => {
      this._consoleMessages.push(consoleMessage.text())
    })
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
   */
  async goto(path: string): Promise<null | Response> {
    return await this._page.goto(path, {
      timeout: 1000,
      waitUntil: 'domcontentloaded',
    })
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
   * Hover over element
   */
  async hover(selector: string): Promise<void> {
    await this._page.hover(selector)
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
    await expect(this._page.locator('h1')).toBeVisible()
  }

  /**
   * Check if page has specific heading
   */
  async expectHasHeading(text: string | RegExp): Promise<void> {
    // eslint-disable-next-line security/detect-non-literal-regexp
    const textRegEx = text instanceof RegExp ? text : new RegExp(text)
    await expect(this._page.locator('h1, h2, h3').filter({ hasText: textRegEx })).toBeVisible()
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
      links.map((link) => (link as HTMLAnchorElement).href)
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
    await expect(this._page.locator('#cookie-modal-id')).toBeVisible()
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
    return this._page.waitForFunction(() => localStorage.getItem('theme') !== null)
  }

  async getThemeKeyValue(): Promise<string | null> {
    return this._page.evaluate(() => localStorage.getItem('theme'))
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
   * Throw errors that are normally handled internally
   */
  async disableErrorBoundary(): Promise<void> {
    await this._page.addInitScript(() => {
      window._throw = false
    })
  }

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
  async enable404Listener(): Promise<void> {
    this._page.on('response', async response => {
      if (response.status() >= 400 && response.status() < 500) {
        this.errors404.push(this._page.url())
      }
    })
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
}
