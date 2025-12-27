/**
 * Contact Form E2E Tests
 *
 * Focuses on client-side validation and UI behaviors of the contact form.
 * Also see test/e2e/specs/02-pages/contact.spec.ts for navigation and basic load tests.
 */
import type { Page } from '@playwright/test'
import {
  BasePage,
  expect,
  test,
  spyOnFetchEndpoint,
  mockFetchEndpointResponse,
} from '@test/e2e/helpers'
import { TestError } from '@test/errors'
import { TEST_CONTACT_DATA, TEST_EMAILS } from '@test/e2e/fixtures/test-data'

const CONTACT_PATH = '/contact'

const contactSubmitActionEndpoint = '/_actions/contact/submit'

const waitForContactFormHydration = async (page: BasePage) => {
  await page.waitForFunction(() => {
    const container = document.getElementById('uppyContainer')
    return !!container && container.hidden === false
  }, undefined, { timeout: 3000 })
}

const setupContactPage = async (playwrightPage: Page): Promise<BasePage> => {
  const page = await BasePage.init(playwrightPage)
  await page.goto(CONTACT_PATH)
  await waitForContactFormHydration(page)
  return page
}

const fillRequiredFields = async (page: BasePage) => {
  await page.fill('#name', TEST_CONTACT_DATA.valid.name)
  await page.fill('#email', TEST_CONTACT_DATA.valid.email)
  await page.fill('#message', `${TEST_CONTACT_DATA.valid.message} Additional context for testing.`)
}

const fillContactFormWithValidData = async (page: BasePage, overrides?: { email?: string }) => {
  const uniqueSuffix = Date.now()
  const email = overrides?.email ?? `contact-form-ui-${uniqueSuffix}@example.com`

  await page.fill('#name', TEST_CONTACT_DATA.valid.name)
  await page.fill('#email', email)
  await page.fill('#company', TEST_CONTACT_DATA.valid.company)
  await page.fill('#phone', TEST_CONTACT_DATA.valid.phone)
  await page.locator('#project_type').selectOption('website')
  await page.locator('#budget').selectOption('10k-25k')
  await page.locator('#timeline').selectOption('asap')
  await page.fill('#message', `${TEST_CONTACT_DATA.valid.message} UI flow ${uniqueSuffix}`)
  await page.check('#contact-gdpr-consent')

  await expect(page.locator('#project_type')).toHaveValue('website')
  await expect(page.locator('#budget')).toHaveValue('10k-25k')
  await expect(page.locator('#timeline')).toHaveValue('asap')
  await expect(page.locator('#contact-gdpr-consent')).toBeChecked()

  return { email }
}

test.describe('Contact Form', () => {
  test('@ready email validation surfaces inline error messages on blur', async ({ page: playwrightPage }) => {
    const page = await setupContactPage(playwrightPage)

    const emailInput = page.locator('#email')
    await emailInput.fill(TEST_EMAILS.invalid)
    await page.locator('#name').click() // Trigger blur

    const emailFeedback = page.locator('[data-field-error="email"]')
    await expect(emailFeedback).toBeVisible()
    await expect(emailFeedback).toContainText('email address')
  })

  test('@ready message character counter updates as users type', async ({ page: playwrightPage }) => {
    const page = await setupContactPage(playwrightPage)

    const message = 'Hello from the contact form e2e suite.'
    await page.fill('#message', message)

    const charCount = page.locator('#charCount')
    await expect(charCount).toHaveText(String(message.length))
  })

  test('@ready required select fields block submission when empty', async ({ page: playwrightPage }) => {
    const page = await setupContactPage(playwrightPage)

    await fillRequiredFields(page)
    await page.locator('#project_type').selectOption('website')
    await page.locator('#timeline').selectOption('asap')

    const fetchSpy = await spyOnFetchEndpoint(playwrightPage, contactSubmitActionEndpoint)

    try {
      await page.click('#submitBtn')

      await expect(page.locator('#formErrorBanner')).toBeVisible()
      await expect(page.locator('#budget + .field-error')).toContainText('This field is required')

      const apiCallCount = await fetchSpy.getCallCount()
      if (apiCallCount > 0) {
        throw new TestError('Contact API was called despite validation errors')
      }
    } finally {
      await fetchSpy.restore()
    }
  })

  test('@ready upload placeholder becomes visible after hydration', async ({ page: playwrightPage }) => {
    const page = await setupContactPage(playwrightPage)

    const uppyContainer = page.locator('#uppyContainer')
    await expect(uppyContainer).toBeVisible()
    await expect(page.locator('#uppyDashboard')).toBeVisible()
    await expect(uppyContainer.locator('.uppy-Dashboard')).toBeVisible({ timeout: 5000 })
  })

  test('@mocks contact form submits successfully when API is available', async ({ page: playwrightPage }) => {
    const page = await setupContactPage(playwrightPage)
    await fillContactFormWithValidData(page)

    await page.click('#submitBtn')

    await expect(page.locator('#formMessages .message-success')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#formMessages .message-error')).toBeHidden()
  })

  test('@ready contact form surfaces API error responses to users', async ({ page: playwrightPage }) => {
    const page = await setupContactPage(playwrightPage)
    await fillContactFormWithValidData(page)

    const apiErrorOverride = await mockFetchEndpointResponse(playwrightPage, {
      endpoint: '/_actions/',
      body: {
        success: false,
        message: 'Unable to reach contact API. Please try again shortly.',
      },
      status: 200,
      headers: {
        'Content-Type': 'application/json+devalue',
      },
    })

    try {
      await page.click('#submitBtn')
      await apiErrorOverride.waitForCall()

      await expect(page.locator('#formMessages .message-error')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('#errorMessage')).toContainText(
        /Unable to reach contact API|Unable to send message\. Please try again later\./
      )
    } finally {
      await apiErrorOverride.restore()
    }
  })
})
