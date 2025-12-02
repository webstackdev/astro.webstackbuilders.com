import { expect, test, wiremock, mocksEnabled } from '@test/e2e/helpers'

const NEWSLETTER_ENDPOINT = '/api/newsletter'
const RESEND_EMAIL_PATH = '/emails'

test.describe('Newsletter API integrations', () => {
  if (!mocksEnabled) {
    test.skip(true, 'E2E_MOCKS=1 is required to run newsletter API integration tests')
  }

  test.describe.configure({ mode: 'serial' })

  test('@mocks sends double opt-in email through Resend mock', async ({ request }) => {
    const uniqueEmail = `newsletter-${Date.now()}@example.com`
    const response = await request.post(NEWSLETTER_ENDPOINT, {
      headers: {
        'x-e2e-mocks': '1',
      },
      data: {
        email: uniqueEmail,
        consentGiven: true,
      },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.requiresConfirmation).toBe(true)

    const loggedRequest = await wiremock.resend.expectRequest({
      method: 'POST',
      urlPath: RESEND_EMAIL_PATH,
      bodyIncludes: [uniqueEmail, 'newsletter@webstackbuilders.com'],
    })

    if (!loggedRequest) {
      throw new Error('Resend mock did not capture the newsletter double opt-in payload')
    }

    const payload = JSON.parse(loggedRequest.request.body ?? '{}') as {
      from: string
      to: string | string[]
      html?: string
      text?: string
    }

    expect(payload.from).toContain('newsletter@webstackbuilders.com')
    const confirmLink = payload.html?.match(/newsletter\/confirm\/([A-Za-z0-9_-]+)/)
    expect(confirmLink?.[1]).toBeTruthy()
    if (Array.isArray(payload.to)) {
      expect(payload.to).toContain(uniqueEmail)
    } else {
      expect(payload.to).toBe(uniqueEmail)
    }
  })

  test('@mocks requires consent before sending any emails', async ({ request }) => {
    const emailWithoutConsent = 'noconsent@example.com'
    const response = await request.post(NEWSLETTER_ENDPOINT, {
      headers: {
        'x-e2e-mocks': '1',
      },
      data: {
        email: emailWithoutConsent,
        consentGiven: false,
      },
    })

    expect(response.status()).toBe(400)
    const requests = await wiremock.resend.findRequests({
      method: 'POST',
      urlPath: RESEND_EMAIL_PATH,
      bodyIncludes: emailWithoutConsent,
    })
    expect(requests.length).toBe(0)
  })
})
