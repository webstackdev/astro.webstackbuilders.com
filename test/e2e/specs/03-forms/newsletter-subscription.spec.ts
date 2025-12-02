/**
 * Newsletter Subscription Form E2E Tests
 * Tests for newsletter signup functionality
 */
import { test, expect, spyOnFetchEndpoint, delayFetchForEndpoint, mockFetchEndpointResponse } from '@test/e2e/helpers'
import { EvaluationError } from '@test/errors'
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
    const fetchSpy = await spyOnFetchEndpoint(newsletterPage.page, '/api/newsletter')

    try {
      // Wait for page to be fully loaded with scripts
      await newsletterPage.waitForLoadState('networkidle')
      await newsletterPage.waitForFunction(() => {
        const button = document.querySelector('#newsletter-submit')
        return button instanceof HTMLButtonElement && !button.disabled
      }, undefined, { timeout: 3000 })

      await newsletterPage.fillEmail(TEST_EMAILS.valid)
      // Don't check GDPR consent - leave it unchecked
      await newsletterPage.submitForm()

      // Wait for client-side validation to show error message
      await newsletterPage.waitForFunction(() => {
        const message = document.getElementById('newsletter-message')
        return message && message.textContent && message.textContent.includes('consent')
      }, { timeout: 3000 })

      // Verify that no API call was made (client-side validation prevented it)
      const apiCallCount = await fetchSpy.getCallCount()
      if (apiCallCount > 0) {
        throw new EvaluationError('API call was made - client-side validation failed to prevent submission')
      }

      // Should show consent required error message
      await newsletterPage.expectMessageContains('Please consent to receive marketing communications')
    } finally {
      await fetchSpy.restore()
    }
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
    const browserName = newsletterPage.context().browser()?.browserType().name()
    const delayMs = browserName === 'webkit' ? 300 : 100
    const delayOverride = await delayFetchForEndpoint(newsletterPage.page, { endpoint: '/api/newsletter', delayMs })

    // Click submit and immediately check for spinner
    const submitButton = newsletterPage.locator('#newsletter-submit')

    // Submit form and check loading state immediately
    const submitPromise = submitButton.click()

    try {
      // The spinner should enter the loading state during the API call
      await newsletterPage.waitForSpinnerLoadingState()

      // Wait for the submit to complete
      await submitPromise
    } finally {
      await delayOverride.restore()
    }
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

  test('@ready valid email blur shows guidance message', async ({ page: playwrightPage }) => {
    const newsletterPage = await NewsletterPage.init(playwrightPage)
    await newsletterPage.navigateToNewsletterForm()

    await newsletterPage.fillEmail(TEST_EMAILS.valid)
    await newsletterPage.blurEmailInput()

    await newsletterPage.expectMessageContains("You'll receive a confirmation email. Click the link to complete your subscription.")
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

  test('@ready API error preserves form state and surfaces message', async ({ page: playwrightPage }) => {
    const newsletterPage = await NewsletterPage.init(playwrightPage)
    await newsletterPage.navigateToNewsletterForm()

    const mockResponse = await mockFetchEndpointResponse(newsletterPage.page, {
      endpoint: '/api/newsletter',
      status: 429,
      body: { success: false, error: 'Try again in 30 seconds.' },
    })

    try {
      await newsletterPage.fillEmail(TEST_EMAILS.valid)
      await newsletterPage.checkGdprConsent()
      await newsletterPage.submitForm()

      await newsletterPage.expectMessageContains('Try again in 30 seconds.')
      await newsletterPage.expectEmailValue(TEST_EMAILS.valid)
      await newsletterPage.expectGdprChecked()
    } finally {
      await mockResponse.restore()
    }
  })

  test('@ready submit button disables during pending request', async ({ page: playwrightPage }) => {
    const newsletterPage = await NewsletterPage.init(playwrightPage)
    await newsletterPage.navigateToNewsletterForm()

    await newsletterPage.fillEmail(TEST_EMAILS.valid)
    await newsletterPage.checkGdprConsent()

    await newsletterPage.waitForFunction(() => {
      const button = document.querySelector('#newsletter-submit')
      return button instanceof HTMLButtonElement && button.disabled === false
    }, undefined, { timeout: 3000 })

    const browserName = newsletterPage.context().browser()?.browserType().name()
    const delayMs = browserName === 'webkit' ? 400 : 200
    const delayOverride = await delayFetchForEndpoint(newsletterPage.page, { endpoint: '/api/newsletter', delayMs })
    const submitButton = newsletterPage.locator('#newsletter-submit')

    const submitPromise = submitButton.click()

    try {
      await expect(submitButton).toBeDisabled({ timeout: 2000 })
      await submitPromise
      await expect(submitButton).toBeEnabled({ timeout: 2000 })
    } finally {
      await delayOverride.restore()
    }
  })
})
