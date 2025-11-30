import { describe, expect, test } from 'vitest'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import {
  buildApiErrorResponse,
  formatApiErrorLogEntry,
} from '@pages/api/_errors/apiFunctionHandler'

describe(`formatApiErrorLogEntry`, () => {
  test(`returns structured log payload with metadata`, () => {
    const error = new ApiFunctionError(`Invalid payload`, {
      status: 422,
      code: 'INVALID',
    })

    const entry = formatApiErrorLogEntry(error, {
      route: '/api/test',
      operation: 'POST',
      runtime: 'node',
      region: 'iad1',
      consentFunctional: false,
      requestId: 'req-123',
      correlationId: 'cor-456',
      requestMeta: { ipHash: 'abc', method: 'POST' },
    })

    expect(entry).toMatchObject({
      level: 'error',
      route: '/api/test',
      operation: 'POST',
      runtime: 'node',
      region: 'iad1',
      status: 422,
      code: 'INVALID',
      retryable: false,
      requestId: 'req-123',
      correlationId: 'cor-456',
      consentFunctional: false,
      requestMeta: { ipHash: 'abc', method: 'POST' },
      message: 'Invalid payload',
    })
  })
})

describe(`buildApiErrorResponse`, () => {
  test(`produces Response with safe payload`, async () => {
    const error = new ApiFunctionError('Server failed', { status: 503, code: 'UPSTREAM' })

    const response = buildApiErrorResponse(error, {
      fallbackMessage: 'Please try later',
      headers: { 'x-test': 'yes' },
    })

    expect(response.status).toBe(503)
    expect(response.headers.get('content-type')).toBe('application/json')
    expect(response.headers.get('x-test')).toBe('yes')

    const body = await response.json()
    expect(body).toEqual({
      error: {
        status: 503,
        code: 'UPSTREAM',
        message: 'Please try later',
        retryable: true,
      },
    })
  })
})
