import { expect, test } from '@test/e2e/helpers'

const CONTACT_ACTION_ENDPOINT = '/_actions/contact.submit'

test.describe('Contact API integrations', () => {
  test('@mocks accepts valid submissions', async ({ request }) => {
    const uniqueEmail = `contact-${Date.now()}@example.com`
    const response = await request.post(CONTACT_ACTION_ENDPOINT, {
      multipart: {
        name: 'Integration Bot',
        email: uniqueEmail,
        message: 'Automated contact form verification message.',
        'project_type': 'website',
        budget: '10k-25k',
        consent: 'true',
      },
    })

    expect(response.status()).toBe(200)
    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')

    // Astro Actions serialize results using Devalue, which isn't always JSON.parse-friendly.
    // Validate using a lightweight string check instead of parsing a structured object.
    const bodyText = await response.text()
    expect(bodyText).toContain('Thank you for your message')
  })

  test('@mocks rejects invalid submissions', async ({ request }) => {
    const invalidEmail = `invalid-contact-${Date.now()}@example.com`
    const response = await request.post(CONTACT_ACTION_ENDPOINT, {
      multipart: {
        name: 'x',
        email: invalidEmail,
        message: 'short',
        budget: '10k-25k',
      },
    })

    expect(response.status()).toBe(400)
  })
})
