import { expect, test } from '@test/e2e/helpers'
import { insertDsarRequest } from '@test/e2e/db'

const GDPR_REQUEST_DATA_ACTION_ENDPOINT = '/_actions/gdpr.requestData'
const GDPR_VERIFY_DSAR_ACTION_ENDPOINT = '/_actions/gdpr.verifyDsar'

test.describe('GDPR API integrations', () => {
  test('@mocks accepts DSAR requests with valid email', async ({ request }) => {
    const uniqueEmail = `dsar-${Date.now()}@example.com`

    const response = await request.post(GDPR_REQUEST_DATA_ACTION_ENDPOINT, {
      data: {
        email: uniqueEmail,
        requestType: 'ACCESS',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('Verification email sent')
  })

  test('@mocks rejects DSAR requests with invalid email', async ({ request }) => {
    const response = await request.post(GDPR_REQUEST_DATA_ACTION_ENDPOINT, {
      data: {
        email: 'not-an-email',
        requestType: 'ACCESS',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    expect(response.status()).toBe(400)
  })

  test('@mocks verifies ACCESS tokens and returns export download', async ({ request }) => {
    const { token } = await insertDsarRequest({
      requestType: 'ACCESS',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })

    const response = await request.post(GDPR_VERIFY_DSAR_ACTION_ENDPOINT, {
      data: {
        token,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('download')
    expect(body).toContain('my-data-')
  })

  test('@mocks returns invalid for unknown tokens', async ({ request }) => {
    const response = await request.post(GDPR_VERIFY_DSAR_ACTION_ENDPOINT, {
      data: {
        token: `invalid-${Date.now()}`,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('invalid')
  })
})
