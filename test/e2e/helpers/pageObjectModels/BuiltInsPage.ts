/**
 * BuiltIns Page Object Model
 *
 * Thin wrappers around Playwright's built-in `Page` APIs.
 * BasePage extends this so higher-level helpers stay separate from core Playwright surface.
 */

import type { BrowserContext, Locator, Page, Response } from '@playwright/test'
import { wait } from '@test/e2e/helpers/waitTimeouts'

export interface BuiltInsGotoOptions {
  skipCookieDismiss?: boolean
  timeout?: number
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'
}

export interface BuiltInsReloadOptions {
  timeout?: number
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'
}

export class BuiltInsPage {
  readonly page: Page

  private getBrowserTypeName(): string | undefined {
    return this._page.context().browser()?.browserType().name()
  }

  private isWebkit(): boolean {
    return this.getBrowserTypeName() === 'webkit'
  }

  protected constructor(protected readonly _page: Page) {
    this.page = _page
  }

  /**
   * Hook for subclasses to decorate `goto` (e.g. dismiss modals).
   */
  protected async afterGoto(_path: string, _options?: BuiltInsGotoOptions): Promise<void> {
    // Base implementation does nothing
  }

  /**
   * Navigate to a specific path.
   *
   * This mirrors Playwright's `page.goto`, but allows a subclass to decorate the navigation
   * via `afterGoto` (without re-implementing retry logic everywhere).
   */
  async goto(path: string, options?: BuiltInsGotoOptions): Promise<null | Response> {
    const requestedTimeout = options?.timeout ?? wait.navigation
    const waitUntil = options?.waitUntil ?? 'domcontentloaded'

    const navigate = async (timeout: number) => {
      return await this._page.goto(path, {
        timeout,
        waitUntil,
      })
    }

    let response: null | Response = null

    try {
      response = await navigate(requestedTimeout)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('ERR_ABORTED')) {
        response = await navigate(requestedTimeout)
      } else if (!options?.timeout && message.includes('Timeout') && requestedTimeout < wait.navigation) {
        // Allow a single retry with a longer timeout to absorb slow prerender navigations
        response = await navigate(wait.navigation)
      } else {
        throw error
      }
    }

    await this.afterGoto(path, options)

    return response
  }

  /**
   * Reload the current page.
   */
  async reload(options?: BuiltInsReloadOptions): Promise<null | Response> {
    return await this._page.reload(options)
  }

  /**
   * Evaluate JS script in the browser.
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
   * Mirror Playwright's `page.locator`.
   */
  locator(selector: string, options?: Parameters<Page['locator']>[1]): Locator {
    return this._page.locator(selector, options)
  }

  /**
   * Convenience helper to check if an element exists and is visible.
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this._page.locator(selector).isVisible()
  }

  /**
   * Take a screenshot.
   */
  async takeScreenshot(name: string): Promise<void> {
    await this._page.screenshot({ path: `test/e2e/screenshots/${name}.png`, fullPage: true })
  }

  /**
   * Set viewport size.
   */
  async setViewport(width: number, height: number): Promise<void> {
    await this._page.setViewportSize({ width, height })
  }

  /**
   * Set viewport size using object parameter.
   */
  async setViewportSize(size: { width: number; height: number }): Promise<void> {
    await this._page.setViewportSize(size)
  }

  /**
   * Wait for selector to be visible.
   */
  async waitForSelector(selector: string, options?: Parameters<Page['waitForSelector']>[1]): Promise<void> {
    if (options) {
      await this._page.waitForSelector(selector, options)
      return
    }

    await this._page.waitForSelector(selector)
  }

  /**
   * Click an element.
   */
  async click(selector: string, options?: Parameters<Page['click']>[1]): Promise<void> {
    await this._page.click(selector, options)
  }

  /**
   * Fill an input field.
   */
  async fill(selector: string, value: string, options?: Parameters<Page['fill']>[2]): Promise<void> {
    await this._page.fill(selector, value, options)
  }

  /**
   * Check a checkbox.
   */
  async check(selector: string, options?: Parameters<Page['check']>[1]): Promise<void> {
    await this._page.check(selector, options)
  }

  /**
   * Uncheck a checkbox.
   */
  async uncheck(selector: string, options?: Parameters<Page['uncheck']>[1]): Promise<void> {
    await this._page.uncheck(selector, options)
  }

  /**
   * Scroll to element.
   */
  async scrollToElement(selector: string): Promise<void> {
    await this._page.locator(selector).scrollIntoViewIfNeeded()
  }

  /**
   * Press keyboard key.
   */
  async pressKey(key: Parameters<Page['keyboard']['press']>[0]): Promise<void> {
    await this._page.keyboard.press(key)
  }

  /**
   * Type text using keyboard.
   */
  async type(text: string): Promise<void> {
    await this._page.keyboard.type(text)
  }

  /**
   * Get keyboard object for advanced keyboard operations.
   */
  get keyboard(): Page['keyboard'] {
    return this._page.keyboard
  }

  /**
   * Get mouse object for advanced mouse operations.
   */
  get mouse(): Page['mouse'] {
    return this._page.mouse
  }

  /**
   * Get touchscreen object for touch operations.
   */
  get touchscreen(): Page['touchscreen'] {
    return this._page.touchscreen
  }

  /**
   * Hover over element.
   */
  async hover(selector: string, options?: Parameters<Page['hover']>[1]): Promise<void> {
    await this._page.hover(selector, options)
  }

  /**
   * Wait for load state.
   */
  async waitForLoadState(state?: Parameters<Page['waitForLoadState']>[0]): Promise<void> {
    await this._page.waitForLoadState(state)
  }

  /**
   * Best-effort wait for "networkidle".
   *
   * NOTE: On WebKit/mobile-safari, Playwright's strict "networkidle" can hang due to long-lived
   * connections/background activity. This helper caps the wait so tests don't stall forever.
   *
   * Prefer deterministic DOM gating (e.g. specific selectors, app-ready attributes, or
   * `waitForPageLoad()` for View Transitions) when possible.
   */
  async waitForNetworkIdleBestEffort(options?: { timeout?: number }): Promise<void> {
    if (!this.isWebkit()) {
      await this._page.waitForLoadState('networkidle')
      return
    }

    const timeout = options?.timeout ?? wait.quickAssert

    await Promise.race([
      this._page.waitForLoadState('networkidle'),
      new Promise<void>((resolve) => {
        setTimeout(resolve, timeout)
      }),
    ])
  }

  /**
   * Wait for specified timeout in milliseconds.
   * @deprecated Prefer event-based waits or `wait.*` knobs.
   */
  async wait(timeout: number): Promise<void> {
    await this._page.waitForTimeout(timeout)
  }

  /**
   * Wait for specified timeout in milliseconds.
   * Alias for wait() method.
   * @deprecated Prefer event-based waits or `wait.*` knobs.
   */
  async waitForTimeout(timeout: number): Promise<void> {
    await this._page.waitForTimeout(timeout)
  }

  /**
   * Wait for a custom function to return truthy value.
   */
  async waitForFunction(
    pageFunction: Parameters<Page['waitForFunction']>[0],
    arg?: Parameters<Page['waitForFunction']>[1],
    options?: Parameters<Page['waitForFunction']>[2]
  ): Promise<void> {
    await this._page.waitForFunction(pageFunction, arg, options)
  }

  /**
   * Intercept and modify network requests.
   */
  async route(
    targetUrl: Parameters<Page['route']>[0],
    handler: Parameters<Page['route']>[1]
  ): Promise<void> {
    await this._page.route(targetUrl, handler)
  }

  /**
   * Wait for URL to change to match the expected pattern.
   */
  async waitForURL(urlPattern: Parameters<Page['waitForURL']>[0], options?: Parameters<Page['waitForURL']>[1]): Promise<void> {
    await this._page.waitForURL(urlPattern, options)
  }

  /**
   * Wait for a response matching the URL pattern.
   */
  async waitForResponse(
    urlPattern: Parameters<Page['waitForResponse']>[0],
    options?: Parameters<Page['waitForResponse']>[1]
  ): Promise<Response> {
    return await this._page.waitForResponse(urlPattern, options)
  }

  /**
   * Get current URL.
   */
  getCurrentUrl(): string {
    return this._page.url()
  }

  /**
   * Get page URL (alias for getCurrentUrl).
   */
  url(): string {
    return this._page.url()
  }

  /**
   * Get page title.
   */
  async title(): Promise<string> {
    return await this._page.title()
  }

  /**
   * Get the browser context that the page belongs to.
   */
  context(): BrowserContext {
    return this._page.context()
  }

  /**
   * Emulate media features (e.g., prefers-color-scheme, reduced-motion).
   */
  async emulateMedia(options: Parameters<Page['emulateMedia']>[0]): Promise<void> {
    await this._page.emulateMedia(options)
  }
}
