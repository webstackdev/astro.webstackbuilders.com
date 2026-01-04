import { expect, test } from '@test/e2e/helpers'

const DOWNLOADS_SUBMIT_ACTION_ENDPOINT = '/_actions/downloads.submit'

test.describe('Downloads API integrations', () => {
  test('@mocks accepts valid submissions (consent optional)', async ({ request }) => {
    const response = await request.post(DOWNLOADS_SUBMIT_ACTION_ENDPOINT, {
      data: {
        firstName: 'Integration',
        lastName: 'Bot',
        workEmail: `downloads-${Date.now()}@example.com`,
        jobTitle: 'Engineer',
        companyName: 'ExampleCo',
        consent: false,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    expect(response.status()).toBe(200)
    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')

    // Astro Actions serialize results using Devalue; validate via text.
    const bodyText = await response.text()
    expect(bodyText).toContain('Form submitted successfully')
  })

  test('@mocks rejects invalid submissions', async ({ request }) => {
    const response = await request.post(DOWNLOADS_SUBMIT_ACTION_ENDPOINT, {
      data: {
        firstName: 'x',
        lastName: 'x',
        workEmail: 'not-an-email',
        jobTitle: 'x',
        companyName: 'x',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    expect(response.status()).toBe(400)
  })
})
