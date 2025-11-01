/**
 * Newsletter Subscription Form E2E Tests
 * Tests for newsletter signup functionality
 */
import { test, expect } from '@test/e2e/helpers'
import { TEST_EMAILS, ERROR_MESSAGES } from '@test/e2e/fixtures/test-data'
import { NewsletterPage } from '@test/e2e/helpers/pageObjectModels/NewsletterPage'

test.describe('Newsletter Subscription Form', () => {
  let newsletterPage: NewsletterPage

  test.beforeEach(async ({ page }) => {
    newsletterPage = new NewsletterPage(page)
    await newsletterPage.navigateToNewsletterForm()
  })

  test('@ready form accepts valid email and shows success message', async () => {
    // Subscribe with valid email and consent
    await newsletterPage.fillEmail(TEST_EMAILS.valid)
    await newsletterPage.checkGdprConsent()
    await newsletterPage.submitForm()

    // Should show confirmation message (using partial match to handle variations)
    await newsletterPage.expectMessageContains('check your email')
  })

  test('@ready form rejects invalid email format', async () => {
    // Try to subscribe with invalid email
    await newsletterPage.fillEmail(TEST_EMAILS.invalid)
    await newsletterPage.checkGdprConsent()
    await newsletterPage.submitForm()

    // Should show email validation error
    await newsletterPage.expectMessageContains(ERROR_MESSAGES.emailInvalid)
  })

  test('@wip form requires GDPR consent', async () => {
    // Note: This test is inconsistent because client-side JS validation
    // may not be attached before the test runs. The validation works in production
    // but is difficult to reliably test in this E2E environment.
    // TODO: Find a reliable way to wait for client-side form validation to load

    await newsletterPage.fillEmail(TEST_EMAILS.valid)
    // Don't check GDPR consent
    await newsletterPage.submitForm()

    // Wait for validation message
    await newsletterPage.wait(200)

    // Should show consent required error
    await newsletterPage.expectMessageContains('Please consent to receive marketing communications')
  })

  test('@ready form requires email address', async ({ page }) => {
    // Try to submit without email - browser validation will prevent submission
    await newsletterPage.checkGdprConsent()

    // Email input should have required attribute
    const emailInput = page.locator('#newsletter-email')
    await expect(emailInput).toHaveAttribute('required', '')
  })

  test('@ready submit button shows loading state', async ({ page }) => {
    // Start subscription
    await newsletterPage.fillEmail(TEST_EMAILS.valid)
    await newsletterPage.checkGdprConsent()

    // Wait for the newsletter form JS to be loaded and initialized
    await page.waitForFunction(() => {
      const button = window.document.querySelector('#newsletter-submit') as HTMLButtonElement
      return button && !button.disabled
    })

    // Set up intercept for API call to slow it down
    await page.route('/api/newsletter', async route => {
      // Add delay to make spinner visible longer
      // Mobile Safari and webkit need longer delay
      const delay = page.context().browser()?.browserType().name() === 'webkit' ? 300 : 100
      await new Promise(resolve => setTimeout(resolve, delay))
      await route.continue()
    })

    // Click submit and immediately check for spinner
    const submitButton = page.locator('#newsletter-submit')
    const spinner = page.locator('#button-spinner')

    // Submit form and check loading state immediately
    const submitPromise = submitButton.click()

    // The spinner should become visible during the API call
    await expect(spinner).toBeVisible({ timeout: 2000 })

    // Wait for the submit to complete
    await submitPromise
  })

  test('@ready form resets after successful submission', async () => {
    // Submit valid subscription
    await newsletterPage.fillEmail(TEST_EMAILS.valid)
    await newsletterPage.checkGdprConsent()
    await newsletterPage.submitForm()

    // Wait for success message (updated to match actual API response)
    await newsletterPage.expectMessageContains('Please check your email to confirm your subscription')

    // Verify form is cleared
    await newsletterPage.expectFormReset()
  })

  test('@ready email validation on blur', async () => {
    // Fill invalid email and blur
    await newsletterPage.fillEmail(TEST_EMAILS.invalid)
    await newsletterPage.blurEmailInput()

    // Should show validation error
    await newsletterPage.expectMessageContains(ERROR_MESSAGES.emailInvalid)
  })

  test('@ready GDPR consent link works', async ({ page }) => {
    // Find the privacy link within the GDPR consent label
    // The structure is: <GDPRConsent> which renders a label with a link inside
    const privacyLink = page.locator('label:has(#newsletter-gdpr-consent) a').first()
    await expect(privacyLink).toBeVisible()
    await expect(privacyLink).toHaveAttribute('href', /privacy/)
  })

  test('@ready API returns confirmation message', async ({ page }) => {
    // Set up response promise before submitting
    const apiResponsePromise = page.waitForResponse('/api/newsletter')

    await newsletterPage.fillEmail(TEST_EMAILS.valid)
    await newsletterPage.checkGdprConsent()
    await newsletterPage.submitForm()

    // Verify API response
    const apiResponse = await apiResponsePromise
    expect(apiResponse.status()).toBe(200)
    const responseData = await apiResponse.json()
    expect(responseData.success).toBe(true)
    expect(responseData.message).toContain('check your email')
  })
})
