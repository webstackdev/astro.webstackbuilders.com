import { expect, test } from '@test/e2e/helpers'

const CONTACT_ENDPOINT = '/api/contact'

test.describe('Contact API integrations', () => {
  test('@mocks accepts valid submissions', async ({ request }) => {
    const uniqueEmail = `contact-${Date.now()}@example.com`
    const response = await request.post(CONTACT_ENDPOINT, {
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
  })

  test('@mocks rejects invalid submissions', async ({ request }) => {
    const invalidEmail = `invalid-contact-${Date.now()}@example.com`
    const response = await request.post(CONTACT_ENDPOINT, {
      data: {
        name: 'x',
        email: invalidEmail,
        message: 'short',
      },
    })

    expect(response.status()).toBe(400)
  })
})
