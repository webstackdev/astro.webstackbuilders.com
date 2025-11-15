/**
 * Newsletter Subscription Form E2E Tests
 * Tests for newsletter signup functionality
 */
import { test, expect } from '@test/e2e/helpers'
import { TEST_EMAILS, ERROR_MESSAGES } from '@test/e2e/fixtures/test-data'
import { NewsletterPage } from '@test/e2e/helpers/pageObjectModels/NewsletterPage'

test.describe('Newsletter Subscription Form', () => {
  test('@ready form accepts valid email and shows success message', async ({ page: playwrightPage }) => {
    const newsletterPage = await NewsletterPage.init(playwrightPage)
    await newsletterPage.navigateToNewsletterForm()

    // Subscribe with valid email and consent
    await newsletterPage.fillEmail(TEST_EMAILS.valid)
    await newsletterPage.checkGdprConsent()
    await newsletterPage.submitForm()

    // Should show confirmation message (using partial match to handle variations)
    await newsletterPage.expectMessageContains('check your email')
  })

  test('@ready form rejects invalid email format', async ({ page: playwrightPage }) => {
    const newsletterPage = await NewsletterPage.init(playwrightPage)
    await newsletterPage.navigateToNewsletterForm()

    // Try to subscribe with invalid email
    await newsletterPage.fillEmail(TEST_EMAILS.invalid)
    await newsletterPage.checkGdprConsent()
    await newsletterPage.submitForm()

    // Should show email validation error
    await newsletterPage.expectMessageContains(ERROR_MESSAGES.emailInvalid)
  })

  test('@ready form requires GDPR consent', async ({ page: playwrightPage }) => {
    const newsletterPage = await NewsletterPage.init(playwrightPage)
    await newsletterPage.navigateToNewsletterForm()
    let apiCallMade = false

    // Monitor API calls to ensure client-side validation prevents submission
    await newsletterPage.route('/api/newsletter', (route) => {
      apiCallMade = true
      route.abort() // Don't actually process it
    })

    // Wait for page to be fully loaded with scripts
    await newsletterPage.waitForLoadState('networkidle')
    await newsletterPage.waitForTimeout(500) // Give scripts time to initialize

    await newsletterPage.fillEmail(TEST_EMAILS.valid)
    // Don't check GDPR consent - leave it unchecked
    await newsletterPage.submitForm()

    // Wait for client-side validation to show error message
    await newsletterPage.waitForFunction(() => {
      const message = document.getElementById('newsletter-message')
      return message && message.textContent && message.textContent.includes('consent')
    }, { timeout: 3000 })

    // Verify that no API call was made (client-side validation prevented it)
    if (apiCallMade) {
      throw new Error('API call was made - client-side validation failed to prevent submission')
    }

    // Should show consent required error message
    await newsletterPage.expectMessageContains('Please consent to receive marketing communications')
  })

  test('@ready form requires email address', async ({ page: playwrightPage }) => {
    const newsletterPage = await NewsletterPage.init(playwrightPage)
    await newsletterPage.navigateToNewsletterForm()

    // Try to submit without email - browser validation will prevent submission
    await newsletterPage.checkGdprConsent()

    // Email input should have required attribute
    const emailInput = newsletterPage.locator('#newsletter-email')
    await expect(emailInput).toHaveAttribute('required', '')
  })

  test('@ready submit button shows loading state', async ({ page: playwrightPage }) => {
    const newsletterPage = await NewsletterPage.init(playwrightPage)
    await newsletterPage.navigateToNewsletterForm()

    // Start subscription
    await newsletterPage.fillEmail(TEST_EMAILS.valid)
    await newsletterPage.checkGdprConsent()

    // Wait for the newsletter form JS to be loaded and initialized
    await newsletterPage.waitForFunction(() => {
      const button = window.document.querySelector('#newsletter-submit')
      return button instanceof HTMLButtonElement && !button.disabled
    })

    // Set up intercept for API call to slow it down
    await newsletterPage.route('/api/newsletter', async route => {
      // Add delay to make spinner visible longer
      // Mobile Safari and webkit need longer delay
      const delay = newsletterPage.context().browser()?.browserType().name() === 'webkit' ? 300 : 100
      await new Promise(resolve => setTimeout(resolve, delay))
      await route.continue()
    })

    // Click submit and immediately check for spinner
    const submitButton = newsletterPage.locator('#newsletter-submit')
    const spinner = newsletterPage.locator('#button-spinner')

    // Submit form and check loading state immediately
    const submitPromise = submitButton.click()

    // The spinner should become visible during the API call
    await expect(spinner).toBeVisible({ timeout: 2000 })

    // Wait for the submit to complete
    await submitPromise
  })

  test('@ready form resets after successful submission', async ({ page: playwrightPage }) => {
    const newsletterPage = await NewsletterPage.init(playwrightPage)
    await newsletterPage.navigateToNewsletterForm()

    // Submit valid subscription
    await newsletterPage.fillEmail(TEST_EMAILS.valid)
    await newsletterPage.checkGdprConsent()
    await newsletterPage.submitForm()

    // Wait for success message (updated to match actual API response)
    await newsletterPage.expectMessageContains('Please check your email to confirm your subscription')

    // Verify form is cleared
    await newsletterPage.expectFormReset()
  })

  test('@ready email validation on blur', async ({ page: playwrightPage }) => {
    const newsletterPage = await NewsletterPage.init(playwrightPage)
    await newsletterPage.navigateToNewsletterForm()

    // Fill invalid email and blur
    await newsletterPage.fillEmail(TEST_EMAILS.invalid)
    await newsletterPage.blurEmailInput()

    // Should show validation error
    await newsletterPage.expectMessageContains(ERROR_MESSAGES.emailInvalid)
  })

  test('@ready GDPR consent link works', async ({ page: playwrightPage }) => {
    const newsletterPage = await NewsletterPage.init(playwrightPage)
    await newsletterPage.navigateToNewsletterForm()

    // Find the privacy link within the GDPR consent label
    // The structure is: <GDPRConsent> which renders a label with a link inside
    const privacyLink = newsletterPage.locator('label:has(#newsletter-gdpr-consent) a').first()
    await expect(privacyLink).toBeVisible()
    await expect(privacyLink).toHaveAttribute('href', /privacy/)
  })

  test('@ready API returns confirmation message', async ({ page: playwrightPage }) => {
    const newsletterPage = await NewsletterPage.init(playwrightPage)
    await newsletterPage.navigateToNewsletterForm()

    // Set up response promise before submitting
    const apiResponsePromise = newsletterPage.waitForResponse('/api/newsletter')

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
