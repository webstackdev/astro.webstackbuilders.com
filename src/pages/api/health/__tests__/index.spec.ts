/**
 * Health endpoint smoke tests
 */
import { describe, it, expect } from 'vitest'
import { GET } from '@pages/api/health'

describe('Health API', () => {
  it('returns ok status payload', async () => {
    const request = new Request('http://localhost/api/health', {
      method: 'GET',
    })

    const response = await GET({ request } as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ status: 'ok' })
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })
})
