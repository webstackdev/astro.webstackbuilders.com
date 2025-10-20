/**
 * Base Page Object Model
 * Common methods and utilities shared across all page objects
 */
import { type Page, expect } from '@playwright/test'

export class BasePage {
  constructor(protected readonly _page: Page) {}

  /**
   * Navigate to a specific path
   */
  async goto(path: string): Promise<void> {
    await this._page.goto(path)
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this._page.waitForLoadState('networkidle')
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this._page.title()
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this._page.url()
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this._page.locator(selector).isVisible()
  }

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
   * Get text content of an element
   */
  async getText(selector: string): Promise<string | null> {
    return await this._page.textContent(selector)
  }

  /**
   * Wait for selector to be visible
   */
  async waitForSelector(selector: string, options?: { timeout?: number }): Promise<void> {
    await this._page.waitForSelector(selector, options)
  }

  /**
   * Verify page title contains expected text
   */
  async verifyTitle(expectedTitle: string | RegExp): Promise<void> {
    await expect(this._page).toHaveTitle(expectedTitle)
  }

  /**
   * Verify page URL matches expected pattern
   */
  async verifyUrl(expectedUrl: string | RegExp): Promise<void> {
    await expect(this._page).toHaveURL(expectedUrl)
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
  async verifyMetaTag(property: string): Promise<void> {
    const content = await this.getMetaContent(property)
    expect(content).toBeTruthy()
    expect(content).not.toBe('')
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this._page.screenshot({ path: `test/e2e/screenshots/${name}.png`, fullPage: true })
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string): Promise<void> {
    await this._page.locator(selector).scrollIntoViewIfNeeded()
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await this._page.waitForLoadState('networkidle')
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
   * Check if page has specific heading
   */
  async hasHeading(text: string | RegExp): Promise<void> {
    await expect(this._page.locator('h1, h2, h3').filter({ hasText: text })).toBeVisible()
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
   * Set viewport size
   */
  async setViewport(width: number, height: number): Promise<void> {
    await this._page.setViewportSize({ width, height })
  }
}
