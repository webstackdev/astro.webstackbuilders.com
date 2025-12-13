import { expect, test } from '@test/e2e/helpers'
import { findLatestNewsletterConfirmationTokenByEmail, waitForLatestNewsletterConfirmationTokenByEmail } from '@test/e2e/db'

const NEWSLETTER_ENDPOINT = '/api/newsletter'

test.describe('Newsletter API integrations', () => {
  test('@mocks creates confirmation token for double opt-in', async ({ request }) => {
    const uniqueEmail = `newsletter-${Date.now()}@example.com`
    const response = await request.post(NEWSLETTER_ENDPOINT, {
      data: {
        email: uniqueEmail,
        consentGiven: true,
      },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.requiresConfirmation).toBe(true)

    const token = await waitForLatestNewsletterConfirmationTokenByEmail(uniqueEmail)
    expect(token).toBeTruthy()

    const confirmResponse = await request.get(`/api/newsletter/confirm?token=${encodeURIComponent(token)}`)
    expect(confirmResponse.status()).toBe(200)
    const confirmBody = await confirmResponse.json()
    expect(confirmBody.success).toBe(true)
  })

  test('@mocks requires consent before creating tokens', async ({ request }) => {
    const emailWithoutConsent = `noconsent-${Date.now()}@example.com`
    const response = await request.post(NEWSLETTER_ENDPOINT, {
      data: {
        email: emailWithoutConsent,
        consentGiven: false,
      },
    })

    expect(response.status()).toBe(400)
    const token = await findLatestNewsletterConfirmationTokenByEmail(emailWithoutConsent)
    expect(token).toBe(null)
  })
})
