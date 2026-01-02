/**
 * E2E Tests for Health Check Endpoint
 *
 * Verifies that API routes are properly served by the dev server
 * and that the health endpoint returns expected 200 OK response.
 *
 * @see src/pages/api/health.ts
 */

import { test, expect } from '@test/e2e/helpers'

test.describe('Health Check Endpoint', () => {
  test('should return 200 OK from /api/health', async ({ page }) => {
    const response = await page.request.get('/api/health')

    expect(response.status()).toBe(200)
    expect(response.ok()).toBe(true)

    const body = await response.json()
    expect(body).toEqual({ status: 'ok' })
  })
})
