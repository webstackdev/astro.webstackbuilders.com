/**
 * Newsletter Subscription Form E2E Tests
 * Tests for newsletter signup functionality
 */
import { test, expect } from '@test/e2e/helpers'
import { TEST_EMAILS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@test/e2e/fixtures/test-data'

test.describe('Newsletter Subscription Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.skip('@wip form accepts valid email', async ({ page }) => {
    // Expected: Should accept and submit valid email
    // Actual: Unknown - needs testing
    await page.fill('#newsletter-email', TEST_EMAILS.valid)
    await page.check('#newsletter-gdpr-consent')
    await page.click('#newsletter-submit')

    await expect(page.locator('#newsletter-message')).toContainText(SUCCESS_MESSAGES.newsletterConfirmation)
  })

  test.skip('@wip form rejects invalid email', async ({ page }) => {
    // Expected: Should show error for invalid email format
    // Actual: Unknown - needs testing
    await page.fill('#newsletter-email', TEST_EMAILS.invalid)
    await page.check('#newsletter-gdpr-consent')
    await page.click('#newsletter-submit')

    await expect(page.locator('#newsletter-message')).toContainText(ERROR_MESSAGES.emailInvalid)
  })

  test.skip('@wip form requires GDPR consent', async ({ page }) => {
    // Expected: Should show error if GDPR not checked
    // Actual: Unknown - needs testing
    await page.fill('#newsletter-email', TEST_EMAILS.valid)
    // Don't check GDPR consent
    await page.click('#newsletter-submit')

    await expect(page.locator('#newsletter-message')).toContainText(ERROR_MESSAGES.consentRequired)
  })

  test.skip('@wip form requires email address', async ({ page }) => {
    // Expected: Should show error if email is empty
    // Actual: Unknown - needs testing
    await page.check('#newsletter-gdpr-consent')
    await page.click('#newsletter-submit')

    await expect(page.locator('#newsletter-message')).toContainText(ERROR_MESSAGES.emailRequired)
  })

  test.skip('@wip submit button shows loading state', async ({ page }) => {
    // Expected: Button should show loading spinner during submission
    // Actual: Unknown - needs testing
    await page.fill('#newsletter-email', TEST_EMAILS.valid)
    await page.check('#newsletter-gdpr-consent')
    await page.click('#newsletter-submit')

    // Check for loading indicator
    await expect(page.locator('#button-spinner')).toBeVisible()
  })

  test.skip('@wip form resets after successful submission', async ({ page }) => {
    // Expected: Form should clear after successful submission
    // Actual: Unknown - needs testing
    await page.fill('#newsletter-email', TEST_EMAILS.valid)
    await page.check('#newsletter-gdpr-consent')
    await page.click('#newsletter-submit')

    // Wait for success message
    await expect(page.locator('#newsletter-message')).toContainText(SUCCESS_MESSAGES.newsletterConfirmation)

    // Verify form is cleared
    await expect(page.locator('#newsletter-email')).toHaveValue('')
    await expect(page.locator('#newsletter-gdpr-consent')).not.toBeChecked()
  })

  test.skip('@wip email validation on blur', async ({ page }) => {
    // Expected: Should validate email when field loses focus
    // Actual: Unknown - needs testing
    await page.fill('#newsletter-email', TEST_EMAILS.invalid)
    await page.locator('#newsletter-email').blur()

    await expect(page.locator('#newsletter-message')).toContainText(ERROR_MESSAGES.emailInvalid)
  })

  test.skip('@wip GDPR consent link works', async ({ page }) => {
    // Expected: GDPR consent should have working privacy link
    // Actual: Unknown - needs testing
    const privacyLink = page.locator('label[for="newsletter-gdpr-consent"] a')
    await expect(privacyLink).toBeVisible()
    await expect(privacyLink).toHaveAttribute('href', /privacy/)
  })

  test.skip('@blocked API returns confirmation message', async ({ page }) => {
    // Blocked by: Need API endpoint available in test env
    // Expected: API should return success message
    // Actual: Unknown - needs API setup
    await page.fill('#newsletter-email', TEST_EMAILS.valid)
    await page.check('#newsletter-gdpr-consent')

    // Intercept API call
    const responsePromise = page.waitForResponse('/api/newsletter')
    await page.click('#newsletter-submit')
    const response = await responsePromise

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
