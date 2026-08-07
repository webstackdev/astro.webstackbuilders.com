/**
 * Tests for client-side Astro action error normalization
 */
import { describe, expect, test } from 'vitest'
import {
  isForbiddenClientActionError,
  normalizeClientActionError,
} from '@components/scripts/errors/actionClient'

describe('normalizeClientActionError', () => {
  test('returns undefined for empty values', () => {
    expect(normalizeClientActionError(undefined)).toBeUndefined()
    expect(normalizeClientActionError(null)).toBeUndefined()
  })

  test('normalizes string errors and extracts status codes from the message', () => {
    expect(normalizeClientActionError('HTTP Client Error with status code: 500')).toEqual({
      message: 'HTTP Client Error with status code: 500',
      status: 500,
    })
  })

  test('reads code and status from Error instances like Astro ActionError', () => {
    const actionError = Object.assign(new Error(''), {
      code: 'INTERNAL_SERVER_ERROR',
      status: 500,
    })

    expect(normalizeClientActionError(actionError)).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      message: '',
      status: 500,
    })
  })

  test('falls back to code and status carried on the error cause', () => {
    const cause = { code: 'FORBIDDEN', status: 403 }
    const error = new Error('Forbidden', { cause })

    expect(normalizeClientActionError(error)).toEqual({
      code: 'FORBIDDEN',
      message: 'Forbidden',
      status: 403,
    })
  })

  test('extracts the status code from the message when no metadata is present', () => {
    expect(
      normalizeClientActionError(new Error('HTTP Client Error with status code: 503'))
    ).toEqual({
      message: 'HTTP Client Error with status code: 503',
      status: 503,
    })
  })

  test('normalizes plain error objects including nested cause metadata', () => {
    expect(
      normalizeClientActionError({
        message: 'Request failed',
        cause: { code: 'BAD_REQUEST', statusCode: 400 },
      })
    ).toEqual({
      code: 'BAD_REQUEST',
      message: 'Request failed',
      status: 400,
    })
  })
})

describe('isForbiddenClientActionError', () => {
  test('detects forbidden errors by code or status', () => {
    expect(isForbiddenClientActionError({ code: 'FORBIDDEN' })).toBe(true)
    expect(isForbiddenClientActionError({ status: 403 })).toBe(true)
    expect(isForbiddenClientActionError({ status: 500 })).toBe(false)
    expect(isForbiddenClientActionError(undefined)).toBe(false)
  })
})
