/**
 * Newsletter Page Object Model
 * Encapsulates newsletter form interactions and validations
 */
import { type Page, expect } from '@playwright/test'
import { BasePage } from '@test/e2e/helpers'

export class NewsletterPage extends BasePage {
  // Selectors
  private readonly formSelector = '#newsletter-form'
  private readonly emailInputSelector = '#newsletter-email'
  private readonly submitButtonSelector = '#newsletter-submit'
  private readonly gdprConsentSelector = '#newsletter-gdpr-consent'
  private readonly messageSelector = '#newsletter-message'
  private readonly buttonSpinnerSelector = '#button-spinner'

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to home page where newsletter form is located
   */
  async navigateToNewsletterForm(): Promise<void> {
    await this.goto('/')
    await this.waitForLoadState('networkidle') // Ensure all scripts are loaded
    await this.expectNewsletterForm()
  }

  /**
   * Fill email input
   */
  async fillEmail(email: string): Promise<void> {
    await this.fill(this.emailInputSelector, email)
  }

  /**
   * Check GDPR consent checkbox
   */
  async checkGdprConsent(): Promise<void> {
    await this.check(this.gdprConsentSelector)
  }

  /**
   * Uncheck GDPR consent checkbox
   */
  async uncheckGdprConsent(): Promise<void> {
    await this.uncheck(this.gdprConsentSelector)
  }

  /**
   * Click submit button
   */
  async submitForm(): Promise<void> {
    await this.click(this.submitButtonSelector)
  }

  /**
   * Blur email input (trigger validation)
   */
  async blurEmailInput(): Promise<void> {
    await this.page.locator(this.emailInputSelector).blur()
  }

  /**
   * Get message text
   */
  async getMessageText(): Promise<string | null> {
    return await this.getText(this.messageSelector)
  }

  /**
   * Submit valid newsletter subscription
   */
  async submitValidSubscription(email: string): Promise<void> {
    await this.fillEmail(email)
    await this.checkGdprConsent()
    await this.submitForm()
  }

  /**
   * ================================================================
   * Expectations / Assertions
   * ================================================================
   */

  /**
   * Verify newsletter form is visible
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.page.locator(this.formSelector)).toBeVisible()
  }

  /**
   * Verify email input is visible
   */
  async expectEmailInputVisible(): Promise<void> {
    await expect(this.page.locator(this.emailInputSelector)).toBeVisible()
  }

  /**
   * Verify submit button is visible
   */
  async expectSubmitButtonVisible(): Promise<void> {
    await expect(this.page.locator(this.submitButtonSelector)).toBeVisible()
  }

  /**
   * Verify GDPR consent is visible
   */
  async expectGdprConsentVisible(): Promise<void> {
    await expect(this.page.locator(this.gdprConsentSelector)).toBeVisible()
  }

  /**
   * Verify message contains text
   */
  async expectMessageContains(text: string | RegExp): Promise<void> {
    await expect(this.page.locator(this.messageSelector)).toContainText(text)
  }

  /**
   * Verify loading spinner is visible
   */
  async expectLoadingSpinnerVisible(): Promise<void> {
    await expect(this.page.locator(this.buttonSpinnerSelector)).toBeVisible()
  }

  /**
   * Verify loading spinner is hidden
   */
  async expectLoadingSpinnerHidden(): Promise<void> {
    await expect(this.page.locator(this.buttonSpinnerSelector)).toBeHidden()
  }

  /**
   * Verify email input has value
   */
  async expectEmailValue(value: string): Promise<void> {
    await expect(this.page.locator(this.emailInputSelector)).toHaveValue(value)
  }

  /**
   * Verify email input is empty
   */
  async expectEmailEmpty(): Promise<void> {
    await expect(this.page.locator(this.emailInputSelector)).toHaveValue('')
  }

  /**
   * Verify GDPR consent is checked
   */
  async expectGdprChecked(): Promise<void> {
    await expect(this.page.locator(this.gdprConsentSelector)).toBeChecked()
  }

  /**
   * Verify GDPR consent is not checked
   */
  async expectGdprNotChecked(): Promise<void> {
    await expect(this.page.locator(this.gdprConsentSelector)).not.toBeChecked()
  }

  /**
   * Verify form is reset (email empty, consent unchecked)
   */
  async expectFormReset(): Promise<void> {
    await this.expectEmailEmpty()
    await this.expectGdprNotChecked()
  }

  /**
   * Verify privacy link exists in GDPR label
   */
  async expectPrivacyLinkVisible(): Promise<void> {
    const privacyLink = this.page.locator(`label[for="${this.gdprConsentSelector.substring(1)}"] a`)
    await expect(privacyLink).toBeVisible()
    await expect(privacyLink).toHaveAttribute('href', /privacy/)
  }

  /**
   * Wait for API response and verify status
   */
  async expectApiResponse(expectedStatus: number): Promise<void> {
    const responsePromise = this.page.waitForResponse('/api/newsletter')
    await this.submitForm()
    const response = await responsePromise
    expect(response.status()).toBe(expectedStatus)
  }

  /**
   * Wait for API response and get JSON data
   */
  async getApiResponse(): Promise<unknown> {
    const responsePromise = this.page.waitForResponse('/api/newsletter')
    await this.submitForm()
    const response = await responsePromise
    return await response.json()
  }
}
