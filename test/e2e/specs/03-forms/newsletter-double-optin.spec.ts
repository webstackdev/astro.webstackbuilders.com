/**
 * Newsletter Double Opt-In Flow E2E Tests
 * Tests for complete newsletter subscription flow including email confirmation
 */
import {
  BasePage,
  test,
  expect,
} from '@test/e2e/helpers'
import { markNewsletterTokenExpired, waitForLatestNewsletterConfirmationTokenByEmail } from '@test/e2e/db'

const HOME_PATH = '/'

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
}

const submitNewsletterSubscription = async (
  page: BasePage,
  email = createUniqueEmail(),
): Promise<NewsletterSubscriptionCapture> => {
  await fillNewsletterForm(page, email)

  await page.click('#newsletter-submit')

  await expect(page.locator('#newsletter-message')).toContainText('confirm your subscription', { timeout: 5000 })

  const token = await waitForLatestNewsletterConfirmationTokenByEmail(email)

  return {
    email,
    localConfirmationPath: `/newsletter/confirm/${token}`,
    token,
  }
}

const markConfirmationTokenExpired = async (token: string): Promise<void> => {
  await markNewsletterTokenExpired(token)
}

test.use({ serviceWorkers: 'block' })

test.describe('Newsletter Double Opt-In Flow', () => {
  test('@mocks user can confirm newsletter subscription via email link', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto(HOME_PATH)

    const subscription = await submitNewsletterSubscription(page)

    await page.goto(subscription.localConfirmationPath)

    await expect(page.locator('#loading-state')).toHaveClass(/hidden/, { timeout: 5000 })
    await expect(page.locator('#success-state')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#user-email')).toHaveText(subscription.email)
  })

  test('@mocks confirmation link expires after time', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto(HOME_PATH)

    const subscription = await submitNewsletterSubscription(page)
    await markConfirmationTokenExpired(subscription.token)

    await page.goto(subscription.localConfirmationPath)

    await expect(page.locator('#loading-state')).toHaveClass(/hidden/, { timeout: 5000 })
    await expect(page.locator('#expired-state')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#success-state')).toHaveClass(/hidden/)
  })

  test('@mocks cannot confirm twice with same link', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto(HOME_PATH)

    const subscription = await submitNewsletterSubscription(page)

    await page.goto(subscription.localConfirmationPath)
    await expect(page.locator('#success-state')).toBeVisible({ timeout: 5000 })

    await page.goto(subscription.localConfirmationPath)

    await expect(page.locator('#expired-state')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('#success-state')).toHaveClass(/hidden/)
  })
})
