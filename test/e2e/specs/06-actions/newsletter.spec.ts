import { expect, test } from '@test/e2e/helpers'
import { findLatestNewsletterConfirmationTokenByEmail, waitForLatestNewsletterConfirmationTokenByEmail } from '@test/e2e/db'

const NEWSLETTER_SUBSCRIBE_ACTION_ENDPOINT = '/_actions/newsletter.subscribe'
const NEWSLETTER_CONFIRM_ACTION_ENDPOINT = '/_actions/newsletter.confirm'

test.describe('Newsletter API integrations', () => {
  test('@mocks creates confirmation token for double opt-in', async ({ request }) => {
    const uniqueEmail = `newsletter-${Date.now()}@example.com`
    const response = await request.post(NEWSLETTER_SUBSCRIBE_ACTION_ENDPOINT, {
      data: {
        email: uniqueEmail,
        consentGiven: true,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const subscribeStatus = response.status()
    const subscribeBody = await response.text()

    expect(subscribeStatus).toBe(200)
    expect(subscribeBody).toContain('requiresConfirmation')

    const token = await waitForLatestNewsletterConfirmationTokenByEmail(uniqueEmail)
    expect(token).toBeTruthy()

    const confirmResponse = await request.post(NEWSLETTER_CONFIRM_ACTION_ENDPOINT, {
      data: {
        token,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    expect(confirmResponse.status()).toBe(200)
    const confirmBody = await confirmResponse.text()
    expect(confirmBody).toContain('Your subscription has been confirmed')
  })

  test('@mocks requires consent before creating tokens', async ({ request }) => {
    const emailWithoutConsent = `noconsent-${Date.now()}@example.com`
    const response = await request.post(NEWSLETTER_SUBSCRIBE_ACTION_ENDPOINT, {
      data: {
        email: emailWithoutConsent,
        consentGiven: false,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    expect(response.status()).toBe(400)
    const token = await findLatestNewsletterConfirmationTokenByEmail(emailWithoutConsent)
    expect(token).toBe(null)
  })
})
