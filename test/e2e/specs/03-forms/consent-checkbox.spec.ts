/**
 * GDPR Consent Banner Tests
 * @see src/components/Consent/
 */

import type { Page } from '@playwright/test'
import {
  BasePage,
  test,
  expect,
  spyOnFetchEndpoint,
  mockFetchEndpointResponse,
} from '@test/e2e/helpers'
import { TEST_EMAILS } from '@test/e2e/fixtures/test-data'

const HOME_PATH = '/'
const CONTACT_PATH = '/contact'
const NEWSLETTER_FORM_SELECTOR = '#newsletter-form'
const NEWSLETTER_EMAIL_INPUT = '#newsletter-email'
const NEWSLETTER_SUBMIT_BUTTON = '#newsletter-submit'
const NEWSLETTER_CONSENT_SELECTOR = '#newsletter-gdpr-consent'
const NEWSLETTER_CONSENT_LABEL_SELECTOR = `label:has(${NEWSLETTER_CONSENT_SELECTOR})`
const NEWSLETTER_PRIVACY_LINK_SELECTOR = `${NEWSLETTER_CONSENT_LABEL_SELECTOR} a[href*="privacy"]`
const NEWSLETTER_CONSENT_ERROR_SELECTOR = '#newsletter-gdpr-consent-error'
const NEWSLETTER_MESSAGE_SELECTOR = '#newsletter-message'
const CONTACT_CONSENT_SELECTOR = '#contact-gdpr-consent'

const waitForNewsletterSection = async (page: BasePage): Promise<void> => {
  await page.waitForLoadState('networkidle')
  await page.locator(NEWSLETTER_FORM_SELECTOR).waitFor({ state: 'visible' })
  await page.waitForFunction(() => {
    const consentCheckbox = document.querySelector<HTMLInputElement>('#newsletter-gdpr-consent')
    const emailInput = document.querySelector<HTMLInputElement>('#newsletter-email')
    return Boolean(consentCheckbox && emailInput)
  }, undefined, { timeout: 5000 })
  await page.scrollToElement(NEWSLETTER_FORM_SELECTOR)
}

const waitForContactForm = async (page: BasePage): Promise<void> => {
  await page.waitForFunction(() => {
    const container = document.getElementById('uppyContainer')
    return Boolean(container && container.hidden === false)
  }, undefined, { timeout: 5000 })
  await page.locator(CONTACT_CONSENT_SELECTOR).waitFor({ state: 'visible' })
  await page.scrollToElement(CONTACT_CONSENT_SELECTOR)
}

const fillNewsletterEmail = async (page: BasePage, email: string = TEST_EMAILS.valid): Promise<void> => {
  await page.fill(NEWSLETTER_EMAIL_INPUT, email)
}

const submitNewsletterForm = async (page: BasePage): Promise<void> => {
  await page.click(NEWSLETTER_SUBMIT_BUTTON)
}

const expectConsentErrorVisible = async (page: BasePage): Promise<void> => {
  const errorMessage = page.locator(NEWSLETTER_CONSENT_ERROR_SELECTOR)
  await expect(errorMessage).toBeVisible()
  await expect(errorMessage).toContainText('consent')
}
test.describe('Newsletter GDPR Consent', () => {
  let pageUnderTest: BasePage
  let playwrightPage: Page

  test.beforeEach(async ({ page }) => {
    playwrightPage = page
    pageUnderTest = await BasePage.init(page)
    await pageUnderTest.goto(HOME_PATH)
    await waitForNewsletterSection(pageUnderTest)
  })

  test('@ready GDPR consent checkbox is visible', async () => {
    await expect(pageUnderTest.locator(NEWSLETTER_CONSENT_SELECTOR)).toBeVisible()
  })

  test('@ready GDPR consent has label', async () => {
    await expect(pageUnderTest.locator(NEWSLETTER_CONSENT_LABEL_SELECTOR)).toContainText('Privacy Policy')
  })

  test('@ready GDPR label contains privacy policy link', async () => {
    const privacyLink = pageUnderTest.locator(NEWSLETTER_PRIVACY_LINK_SELECTOR).first()
    await expect(privacyLink).toBeVisible()
    await expect(privacyLink).toHaveAttribute('href', /\/privacy\/?$/)
  })

  test('@ready privacy policy link opens in new tab', async () => {
    const privacyLink = pageUnderTest.locator(NEWSLETTER_PRIVACY_LINK_SELECTOR).first()
    await expect(privacyLink).toHaveAttribute('target', '_blank')
    await expect(privacyLink).toHaveAttribute('rel', /noopener/)
  })

  test('@ready form cannot submit without GDPR consent', async () => {
    const fetchSpy = await spyOnFetchEndpoint(playwrightPage, '/api/newsletter')

    try {
      await fillNewsletterEmail(pageUnderTest)
      await submitNewsletterForm(pageUnderTest)

      await expect(pageUnderTest.locator(NEWSLETTER_MESSAGE_SELECTOR)).toContainText('Please consent')
      await expectConsentErrorVisible(pageUnderTest)

      const callCount = await fetchSpy.getCallCount()
      expect(callCount).toBe(0)
    } finally {
      await fetchSpy.restore()
    }
  })

  test('@ready form can submit with GDPR consent', async () => {
    const subscriptionEmail = `consent-e2e-${Date.now()}@example.com`
    const successOverride = await mockFetchEndpointResponse(playwrightPage, {
      endpoint: '/api/newsletter',
      status: 200,
      body: {
        success: true,
        message: 'Please check your email to confirm your subscription',
      },
    })

    try {
      await fillNewsletterEmail(pageUnderTest, subscriptionEmail)
      await pageUnderTest.check(NEWSLETTER_CONSENT_SELECTOR)
      await submitNewsletterForm(pageUnderTest)
      await successOverride.waitForCall()

      await expect(pageUnderTest.locator(NEWSLETTER_MESSAGE_SELECTOR)).toContainText('confirm your subscription')
    } finally {
      await successOverride.restore()
    }
  })

  test('@ready GDPR checkbox is accessible via keyboard', async () => {
    const checkbox = pageUnderTest.locator(NEWSLETTER_CONSENT_SELECTOR)
    await checkbox.focus()

    await pageUnderTest.keyboard.press('Space')
    await expect(checkbox).toBeChecked()

    await pageUnderTest.keyboard.press('Space')
    await expect(checkbox).not.toBeChecked()
  })

  test('@ready GDPR error message is displayed', async () => {
    await fillNewsletterEmail(pageUnderTest)
    await submitNewsletterForm(pageUnderTest)
    await expectConsentErrorVisible(pageUnderTest)
  })

  test('@ready GDPR consent state persists during form validation', async () => {
    const checkbox = pageUnderTest.locator(NEWSLETTER_CONSENT_SELECTOR)
    await checkbox.check()
    await expect(checkbox).toBeChecked()

    await pageUnderTest.fill(NEWSLETTER_EMAIL_INPUT, 'invalid-email')
    await submitNewsletterForm(pageUnderTest)
    await expect(pageUnderTest.locator(NEWSLETTER_MESSAGE_SELECTOR)).toContainText('valid email address')
    await expect(checkbox).toBeChecked()
  })
})

test.describe('Contact Form GDPR Consent', () => {
  let pageUnderTest: BasePage

  test.beforeEach(async ({ page }) => {
    pageUnderTest = await BasePage.init(page)
    await pageUnderTest.goto(CONTACT_PATH)
    await waitForContactForm(pageUnderTest)
  })

  test('@ready GDPR checkbox works on contact form', async () => {
    const contactConsent = pageUnderTest.locator(CONTACT_CONSENT_SELECTOR)
    await expect(contactConsent).toBeVisible()

    const contactLabel = pageUnderTest.locator(`label:has(${CONTACT_CONSENT_SELECTOR})`)
    await expect(contactLabel).toContainText('Privacy Policy')

    await contactConsent.check()
    await expect(contactConsent).toBeChecked()
  })
})
