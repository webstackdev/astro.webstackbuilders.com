import { expect, test, wiremock, mocksEnabled } from '@test/e2e/helpers'

const CONTACT_ENDPOINT = '/api/contact'
const RESEND_EMAIL_PATH = '/emails'

test.describe('Contact API integrations', () => {
  if (!mocksEnabled) {
    test.skip(true, 'E2E_MOCKS=1 is required to run contact API integration tests')
  }

  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async () => {
    await wiremock.resend.resetRequests()
  })

  test('@mocks delivers transactional email payload to Resend', async ({ request }) => {
    const uniqueEmail = `contact-${Date.now()}@example.com`
    const response = await request.post(CONTACT_ENDPOINT, {
      headers: {
        'x-e2e-mocks': '1',
      },
      data: {
        name: 'Integration Bot',
        email: uniqueEmail,
        message: 'Automated contact form verification message',
        consent: true,
      },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)

    const loggedRequest = await wiremock.resend.expectRequest({
      method: 'POST',
      urlPath: RESEND_EMAIL_PATH,
      bodyIncludes: [uniqueEmail, 'contact@webstackbuilders.com'],
    })

    if (!loggedRequest) {
      throw new Error('Resend mock did not capture the transactional email payload')
    }

    const payload = JSON.parse(loggedRequest.request.body ?? '{}') as {
      from: string
      to: string | string[]
      subject: string
    }

    expect(payload.from).toContain('contact@webstackbuilders.com')
    if (Array.isArray(payload.to)) {
      expect(payload.to).toContain('info@webstackbuilders.com')
    } else {
      expect(payload.to).toBe('info@webstackbuilders.com')
    }
    expect(payload.subject).toContain('Integration Bot')
  })

  test('@mocks rejects invalid submissions before reaching Resend', async ({ request }) => {
    const response = await request.post(CONTACT_ENDPOINT, {
      headers: {
        'x-e2e-mocks': '1',
      },
      data: {
        name: 'x',
        email: 'invalid-email',
        message: 'short',
      },
    })

    expect(response.status()).toBe(400)
    const requests = await wiremock.resend.findRequests({
      method: 'POST',
      urlPath: RESEND_EMAIL_PATH,
    })
    expect(requests.length).toBe(0)
  })
})
