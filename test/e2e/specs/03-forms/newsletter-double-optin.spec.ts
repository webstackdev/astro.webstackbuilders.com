/**
 * Newsletter Double Opt-In Flow E2E Tests
 * Tests for complete newsletter subscription flow including email confirmation
 */
import type { Page } from '@playwright/test'
import { env } from 'node:process'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  BasePage,
  test,
  expect,
  wiremock,
  mocksEnabled,
  injectHeadersIntoFetch,
} from '@test/e2e/helpers'
import { TestError } from '@test/errors'

const HOME_PATH = '/'
const NEWSLETTER_ENDPOINT = '/api/newsletter'
const RESEND_EMAIL_PATH = '/emails'

interface ResendEmailPayload {
  to?: string | string[]
  html?: string
  text?: string
  subject?: string
  tags?: Array<{ name: string; value: string }>
}

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

const extractConfirmationLink = (payload: ResendEmailPayload): string => {
  const confirmationPattern = /https?:\/\/[^\s"']+\/newsletter\/confirm\/[A-Za-z0-9_-]+/
  const linkMatch = payload.html?.match(confirmationPattern) ?? payload.text?.match(confirmationPattern)
  if (!linkMatch?.[0]) {
    throw new TestError('Confirmation email payload did not contain a confirmation link')
  }
  return linkMatch[0]
}

const SUPABASE_URL = env['SUPABASE_URL']?.replace(/\/$/, '')
const SUPABASE_SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

const supabaseAdminClient: SupabaseClient | null = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

const createUniqueEmail = () =>
  `newsletter-double-optin-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`

type NewsletterSubscriptionCapture = {
  email: string
  payload: ResendEmailPayload
  confirmationUrl: URL
  confirmationLink: string
  localConfirmationPath: string
  token: string
  siteOrigin: string
}

const resolveLocalPath = (url: URL): string => `${url.pathname}${url.search ?? ''}`

const parseTokenFromUrl = (confirmationUrl: URL): string => {
  const token = confirmationUrl.pathname.split('/').filter(Boolean).pop()
  if (!token) {
    throw new TestError('Unable to parse newsletter confirmation token from URL')
  }
  return token
}

const submitNewsletterSubscription = async (
  page: BasePage,
  playwrightPage: Page,
  email = createUniqueEmail(),
): Promise<NewsletterSubscriptionCapture> => {
  const headerOverride = await injectHeadersIntoFetch(playwrightPage, {
    endpoint: NEWSLETTER_ENDPOINT,
    headers: { 'x-e2e-mocks': '1' },
  })

  try {
    await fillNewsletterForm(page, email)

    const responsePromise = playwrightPage.waitForResponse((response) => {
      return response.url().includes(NEWSLETTER_ENDPOINT) && response.request().method() === 'POST'
    })

    await page.click('#newsletter-submit')

    const response = await responsePromise
    expect(response.status()).toBe(200)
    await expect(page.locator('#newsletter-message')).toContainText('confirm your subscription', { timeout: 5000 })

    const loggedRequest = await wiremock.resend.expectRequest({
      method: 'POST',
      urlPath: RESEND_EMAIL_PATH,
      bodyIncludes: [email, 'newsletter-confirmation', 'double-optin'],
    }, { timeoutMs: 7000 })

    if (!loggedRequest?.request.body) {
      throw new TestError('Resend mock captured request without body payload')
    }

    const payload = JSON.parse(loggedRequest.request.body) as ResendEmailPayload

    if (Array.isArray(payload.to)) {
      expect(payload.to).toContain(email)
    } else {
      expect(payload.to).toBe(email)
    }

    const confirmationLink = extractConfirmationLink(payload)
    let confirmationUrl: URL
    try {
      confirmationUrl = new URL(confirmationLink)
    } catch (error) {
      throw new TestError(`Invalid confirmation link received: ${confirmationLink}`, { cause: error })
    }

    return {
      email,
      payload,
      confirmationUrl,
      confirmationLink,
      localConfirmationPath: resolveLocalPath(confirmationUrl),
      token: parseTokenFromUrl(confirmationUrl),
      siteOrigin: confirmationUrl.origin,
    }
  } finally {
    await headerOverride.restore()
  }
}

const confirmTokenViaApi = async (
  playwrightPage: Page,
  token: string,
  siteOrigin: string,
  options?: { mockResend?: boolean },
) => {
  const headers: Record<string, string> = {}
  if (options?.mockResend !== false) {
    headers['x-e2e-mocks'] = '1'
  }
  return await playwrightPage.request.get(
    `${siteOrigin}/api/newsletter/confirm?token=${encodeURIComponent(token)}`,
    { headers },
  )
}

const requireSupabaseClient = (): SupabaseClient => {
  if (!supabaseAdminClient) {
    throw new TestError('Supabase admin client is not available')
  }
  return supabaseAdminClient
}

const markConfirmationTokenExpired = async (token: string): Promise<void> => {
  const supabase = requireSupabaseClient()
  const expiredAt = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { error } = await supabase
    .from('newsletter_confirmations')
    .update({ ['expires_at']: expiredAt })
    .eq('token', token)

  if (error) {
    throw new TestError('Failed to mark confirmation token as expired in Supabase', { cause: error })
  }
}

const extractUnsubscribeLink = (html?: string): string => {
  if (!html) {
    throw new TestError('Confirmation email payload did not contain HTML content')
  }
  const anchorMatch = html.match(/<a[^>]*data-testid="unsubscribe-link"[^>]*>/i)
  if (!anchorMatch?.[0]) {
    throw new TestError('Confirmation email payload did not include an unsubscribe link')
  }
  const hrefMatch = anchorMatch[0].match(/href="([^"]+)"/i)
  if (!hrefMatch?.[1]) {
    throw new TestError('Unsubscribe link did not include an href attribute')
  }
  return hrefMatch[1]
}

test.use({ serviceWorkers: 'block' })

test.describe('Newsletter Double Opt-In Flow', () => {
  if (!mocksEnabled) {
    test.skip(true, 'E2E_MOCKS=1 is required to verify newsletter double opt-in flow')
  }

  test.beforeAll(async () => {
    await wiremock.resend.resetRequests()
  })

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

  test('@mocks confirmation email contains correct content', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto(HOME_PATH)

    const { payload } = await submitNewsletterSubscription(page, playwrightPage)

    expect(payload.subject).toBe('Confirm your newsletter subscription - Webstack Builders')
    expect(payload.html).toContain('Confirm Your Subscription')
    expect(payload.html).toContain('data-testid="unsubscribe-link"')
    expect(payload.text).toContain('Confirm your subscription by clicking this link')
    expect(payload.text).toContain('Unsubscribe:')
    expect(payload.tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'type', value: 'newsletter-confirmation' }),
        expect.objectContaining({ name: 'flow', value: 'double-optin' }),
      ]),
    )
  })

  test('@mocks welcome email sent after confirmation', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto(HOME_PATH)

    const subscription = await submitNewsletterSubscription(page, playwrightPage)
    const confirmResponse = await confirmTokenViaApi(playwrightPage, subscription.token, subscription.siteOrigin)
    expect(confirmResponse.status()).toBe(200)

    const confirmPayload = await confirmResponse.json()
    expect(confirmPayload.success).toBe(true)

    const welcomeRequest = await wiremock.resend.expectRequest({
      method: 'POST',
      urlPath: RESEND_EMAIL_PATH,
      bodyIncludes: [subscription.email, 'newsletter-welcome', 'post-confirmation'],
    }, { timeoutMs: 7000 })

    if (!welcomeRequest?.request.body) {
      throw new TestError('Resend mock did not capture welcome email payload')
    }

    const welcomePayload = JSON.parse(welcomeRequest.request.body) as ResendEmailPayload
    expect(welcomePayload.subject).toContain('Welcome')
    expect(welcomePayload.tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'type', value: 'newsletter-welcome' }),
        expect.objectContaining({ name: 'flow', value: 'post-confirmation' }),
      ]),
    )
  })

  test('@mocks confirmation link expires after time', async ({ page: playwrightPage }) => {
    test.skip(!supabaseAdminClient, 'Supabase containers must be running for confirmation expiry coverage')

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

  test('@mocks unsubscribe link works', async ({ page: playwrightPage }) => {
    const page = await BasePage.init(playwrightPage)
    await page.goto(HOME_PATH)

    const subscription = await submitNewsletterSubscription(page, playwrightPage)
    const unsubscribeHref = extractUnsubscribeLink(subscription.payload.html)
    const unsubscribeUrl = new URL(unsubscribeHref)

    const localPathWithHash = `${unsubscribeUrl.pathname}${unsubscribeUrl.search}${unsubscribeUrl.hash}`
    await page.goto(localPathWithHash)

    await expect(page.locator('h1')).toContainText(/privacy/i)
  })
})
