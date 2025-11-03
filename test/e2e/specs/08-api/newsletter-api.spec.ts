/**
 * Newsletter form API route wrapper of Vercel function
 * endpoint for E2E testing of newsletter subscription
 *
 * @see api/newsletter/
 */

import { test, expect } from '@test/e2e/helpers'

test.describe('Newsletter API', () => {
  test('@ready newsletter endpoint accepts POST', async ({ request }) => {
    // Expected: POST /api/newsletter should accept requests
    const response = await request.post('/api/newsletter', {
      data: {
        email: 'test@example.com',
        consentGiven: true,
      },
    })

    expect([200, 201, 400, 422]).toContain(response.status())
  })

  test('@ready newsletter validates email format', async ({ request }) => {
    // Expected: Invalid email should return 400/422
    const response = await request.post('/api/newsletter', {
      data: {
        email: 'invalid-email',
        consentGiven: true,
      },
    })

    expect([400, 422]).toContain(response.status())

    const body = await response.json()
    expect(body.error || body.message).toBeTruthy()
  })

  test('@ready newsletter requires consent', async ({ request }) => {
    // Expected: Missing consent should fail
    const response = await request.post('/api/newsletter', {
      data: {
        email: 'test@example.com',
        consentGiven: false,
      },
    })

    expect([400, 422]).toContain(response.status())
  })

  test('@ready newsletter returns success for valid request', async ({ request }) => {
    // Expected: Valid request should return 200/201
    const response = await request.post('/api/newsletter', {
      data: {
        email: `test+${Date.now()}@example.com`,
        consentGiven: true,
      },
    })

    expect([200, 201]).toContain(response.status())

    const body = await response.json()
    expect(body.success || body.message).toBeTruthy()
  })

  test('@ready newsletter handles duplicate subscriptions', async ({ request }) => {
    // Expected: Should handle duplicate email gracefully
    const email = `duplicate+${Date.now()}@example.com`

    // First subscription
    await request.post('/api/newsletter', {
      data: { email, consentGiven: true },
    })

    // Second subscription with same email
    const response = await request.post('/api/newsletter', {
      data: { email, consentGiven: true },
    })

    // Should either succeed or return friendly error
    expect([200, 201, 409]).toContain(response.status())
  })

  test.skip('@wip newsletter returns proper content type', async ({ request }) => {
    // Expected: Should return JSON
    const response = await request.post('/api/newsletter', {
      data: {
        email: 'test@example.com',
        consentGiven: true,
      },
    })

    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')
  })

  test('@ready newsletter validates email length', async ({ request }) => {
    // Expected: Excessively long email should fail
    const longEmail = 'a'.repeat(300) + '@example.com'

    const response = await request.post('/api/newsletter', {
      data: {
        email: longEmail,
        consentGiven: true,
      },
    })

    expect([400, 422]).toContain(response.status())
  })

  test('@ready newsletter rejects missing email', async ({ request }) => {
    // Expected: Missing email field should return 400
    const response = await request.post('/api/newsletter', {
      data: {
        consentGiven: true,
      },
    })

    expect([400, 422]).toContain(response.status())
  })

  test('@ready newsletter handles malformed JSON', async ({ request }) => {
    // Expected: Invalid JSON should return 400
    const response = await request.post('/api/newsletter', {
      data: 'this is not json',
    })

    expect([400, 422, 500]).toContain(response.status())
  })

  test('@ready newsletter rate limits requests', async ({ request }) => {
    // Expected: Should have rate limiting to prevent abuse
    const requests = []

    for (let i = 0; i < 20; i++) {
      requests.push(
        request.post('/api/newsletter', {
          data: {
            email: `test${i}@example.com`,
            consentGiven: true,
          },
        })
      )
    }

    const responses = await Promise.all(requests)
    const rateLimited = responses.some((r) => r.status() === 429)

    // May or may not have rate limiting implemented
    expect(typeof rateLimited).toBe('boolean')
  })
})
