/**
 * Newsletter Double Opt-In Flow E2E Tests
 * Tests for complete newsletter subscription flow including email confirmation
 */
import type { Page } from '@playwright/test'
import {
  BasePage,
  test,
  expect,
} from '@test/e2e/helpers'
import { markNewsletterTokenExpired, waitForLatestNewsletterConfirmationTokenByEmail } from '@test/e2e/db'

const HOME_PATH = '/'
const NEWSLETTER_ENDPOINT = '/api/newsletter'

const waitForNewsletterForm = async (page: BasePage) => {
  await page.waitForSelector('#newsletter-email', { timeout: 5000 })
  await page.waitForSelector('#newsletter-gdpr-consent', { timeout: 5000 })
}

const fillNewsletterForm = async (page: BasePage, email: string) => {
  await waitForNewsletterForm(page)
  const emailInput = page.locator('#newsletter-email')
  await emailInput.scrollIntoViewIfNeeded()
  await emailInput.fill(email)
  await page.check('#newsletter-gdpr-consent')
}

const createUniqueEmail = () =>
  `newsletter-double-optin-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`

type NewsletterSubscriptionCapture = {
  email: string
  localConfirmationPath: string
  token: string
  siteOrigin: string
}

const submitNewsletterSubscription = async (
  page: BasePage,
  playwrightPage: Page,
  email = createUniqueEmail(),
): Promise<NewsletterSubscriptionCapture> => {
  await fillNewsletterForm(page, email)

  const responsePromise = playwrightPage.waitForResponse((response) => {
    return response.url().includes(NEWSLETTER_ENDPOINT) && response.request().method() === 'POST'
  })

  await page.click('#newsletter-submit')

  const response = await responsePromise
  expect(response.status()).toBe(200)
  await expect(page.locator('#newsletter-message')).toContainText('confirm your subscription', { timeout: 5000 })

  const token = await waitForLatestNewsletterConfirmationTokenByEmail(email)
  const siteOrigin = new URL(playwrightPage.url()).origin

  return {
    email,
    localConfirmationPath: `/newsletter/confirm/${token}`,
    token,
    siteOrigin,
  }
}

const confirmTokenViaApi = async (
  playwrightPage: Page,
  token: string,
  siteOrigin: string,
) => {
  return await playwrightPage.request.get(
    `${siteOrigin}/api/newsletter/confirm?token=${encodeURIComponent(token)}`,
  )
}

const markConfirmationTokenExpired = async (token: string): Promise<void> => {
  await markNewsletterTokenExpired(token)
}

test.use({ serviceWorkers: 'block' })

test.describe('Newsletter Double Opt-In Flow', () => {
  test('@mocks user can confirm newsletter subscription via email link', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto(HOME_PATH)

    const subscription = await submitNewsletterSubscription(page, playwrightPage)

    const confirmResponsePromise = playwrightPage.waitForResponse((apiResponse) => {
      return apiResponse.url().includes('/api/newsletter/confirm') && apiResponse.request().method() === 'GET'
    })

    await page.goto(subscription.localConfirmationPath)

    const confirmResponse = await confirmResponsePromise
    expect(confirmResponse.status()).toBe(200)

    await expect(page.locator('#loading-state')).toHaveClass(/hidden/, { timeout: 5000 })
    await expect(page.locator('#success-state')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#user-email')).toHaveText(subscription.email)
  })

  test('@mocks confirmation link expires after time', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto(HOME_PATH)

    const subscription = await submitNewsletterSubscription(page, playwrightPage)
    await markConfirmationTokenExpired(subscription.token)

    await page.goto(subscription.localConfirmationPath)

    await expect(page.locator('#loading-state')).toHaveClass(/hidden/, { timeout: 5000 })
    await expect(page.locator('#expired-state')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#success-state')).toHaveClass(/hidden/)
  })

  test('@mocks cannot confirm twice with same link', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto(HOME_PATH)

    const subscription = await submitNewsletterSubscription(page, playwrightPage)
    const confirmResponse = await confirmTokenViaApi(playwrightPage, subscription.token, subscription.siteOrigin)
    expect(confirmResponse.status()).toBe(200)

    await page.goto(subscription.localConfirmationPath)

    await expect(page.locator('#expired-state')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#success-state')).toHaveClass(/hidden/)
  })
})
