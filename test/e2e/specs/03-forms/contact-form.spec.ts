/**
 * Contact Form E2E Tests
 * Focuses on client-side validation and UI behaviors of the contact form.
 */
import type { Page } from '@playwright/test'
import { BasePage, expect, test } from '@test/e2e/helpers'
import { TestError } from '@test/errors'
import { TEST_CONTACT_DATA, TEST_EMAILS } from '@test/e2e/fixtures/test-data'

const CONTACT_PATH = '/contact'

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

    let apiCallMade = false
    await page.route('/api/contact', route => {
      apiCallMade = true
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Budget range is required',
        }),
      })
    })

    await page.click('#submitBtn')

    await expect(page.locator('#formErrorBanner')).toBeVisible()
    await expect(page.locator('#budget + .field-error')).toContainText('This field is required')

    if (apiCallMade) {
      throw new TestError('Contact API was called despite validation errors')
    }
  })

  test('@ready upload placeholder becomes visible after hydration', async ({ page: playwrightPage }) => {
    const page = await setupContactPage(playwrightPage)

    const uppyContainer = page.locator('#uppyContainer')
    await expect(uppyContainer).toBeVisible()
    await expect(uppyContainer).toContainText('File Upload Coming Soon')
  })

  test.skip('@wip contact form submits successfully when API is available', async () => {
    // TODO: Implement when backend Docker harness is ready for full integration tests
  })

  test.skip('@wip contact form surfaces API error responses to users', async () => {
    // TODO: Implement when backend Docker harness is ready for full integration tests
  })
})
