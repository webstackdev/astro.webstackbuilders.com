import { describe, expect, test } from 'vitest'
import { TestError } from '@test/errors'
import { ApiFunctionError } from '@pages/api/_utils/errors'

describe(`ApiFunctionError basics`, () => {
  test(`captures stack, name, and custom metadata`, () => {
    try {
      throw new ApiFunctionError(`Test error`, {
        status: 422,
        code: 'INVALID_PAYLOAD',
        route: '/api/test',
        operation: 'POST',
        requestId: 'req-123',
        correlationId: 'cor-456',
      })
    } catch (error: unknown) {
      const err = error as ApiFunctionError
      expect(err).toBeInstanceOf(ApiFunctionError)
      expect(err).toBeInstanceOf(Error)
      expect(err.name).toBe('ApiFunctionError')
      expect(err.stack).toEqual(expect.any(String))

      expect(err.message).toBe('Test error')
      expect(err.status).toBe(422)
      expect(err.isClientError).toBe(true)
      expect(err.isServerError).toBe(false)
      expect(err.retryable).toBe(false)
      expect(err.code).toBe('INVALID_PAYLOAD')
      expect(err.route).toBe('/api/test')
      expect(err.operation).toBe('POST')
      expect(err.requestId).toBe('req-123')
      expect(err.correlationId).toBe('cor-456')
    }
  })

  test(`normalizes object payloads without message`, () => {
    const sut = new ApiFunctionError({ status: 404, code: 'NOT_FOUND' })
    expect(sut.message).toBe('Internal server error')
    expect(sut.status).toBe(404)
    expect(sut.isClientError).toBe(true)
    expect(sut.retryable).toBe(false)
  })
})

describe(`Status handling`, () => {
  test(`falls back to 500 when status is missing`, () => {
    const sut = new ApiFunctionError(`Boom`)
    expect(sut.status).toBe(500)
    expect(sut.isServerError).toBe(true)
  })

  test(`coerces statuses outside of error range`, () => {
    const client = new ApiFunctionError(`Client`, { status: 100 })
    const server = new ApiFunctionError(`Server`, { status: 999 })
    expect(client.status).toBe(400)
    expect(client.isClientError).toBe(true)
    expect(client.retryable).toBe(false)
    expect(server.status).toBe(500)
    expect(server.isServerError).toBe(true)
    expect(server.retryable).toBe(true)
  })
})

describe(`Retryable handling`, () => {
  test(`marks well-known retryable status codes`, () => {
    const timeout = new ApiFunctionError(`Timeout`, { status: 504 })
    const throttled = new ApiFunctionError(`Throttled`, { status: 429 })
    expect(timeout.retryable).toBe(true)
    expect(throttled.retryable).toBe(true)
  })

  test(`allows explicit override`, () => {
    const sut = new ApiFunctionError(`Custom`, { status: 400, retryable: true })
    expect(sut.retryable).toBe(true)
  })
})

describe(`Details handling`, () => {
  test(`clones detail objects to avoid accidental mutation`, () => {
    const details = { field: 'email' }
    const sut = new ApiFunctionError(`Invalid`, { status: 422, details })

    expect(sut.details).toEqual({ field: 'email' })
    expect(sut.details).not.toBe(details)

    const params = sut.toParams()
    expect(params.details).toEqual({ field: 'email' })
    expect(params.details).not.toBe(details)
  })
})

describe(`Safe messaging helpers`, () => {
  test(`getSafeMessage exposes client error message and hides server error detail`, () => {
    const clientError = new ApiFunctionError(`Bad input`, { status: 400 })
    const serverError = new ApiFunctionError(new TestError(`Sensitive info`), { status: 503 })

    expect(clientError.getSafeMessage()).toBe('Bad input')
    expect(serverError.getSafeMessage()).toBe('Internal server error')
    expect(serverError.getSafeMessage('Something broke')).toBe('Something broke')
  })

  test(`toResponseBody defaults to safe payloads`, () => {
    const clientError = new ApiFunctionError(`Bad input`, {
      status: 422,
      code: 'INVALID_EMAIL',
      requestId: 'req-123',
      details: { field: 'email' },
    })

    expect(clientError.toResponseBody()).toEqual({
      error: {
        status: 422,
        code: 'INVALID_EMAIL',
        message: 'Bad input',
        requestId: 'req-123',
        retryable: false,
        details: { field: 'email' },
      },
    })

    const serverError = new ApiFunctionError(`Internal DB issue`, {
      status: 502,
      code: 'UPSTREAM_FAILURE',
      correlationId: 'cor-456',
      details: { query: 'insert' },
    })

    expect(serverError.toResponseBody()).toEqual({
      error: {
        status: 502,
        code: 'UPSTREAM_FAILURE',
        message: 'Internal server error',
        correlationId: 'cor-456',
        retryable: true,
      },
    })

    expect(
      serverError.toResponseBody({ includeDetails: true, fallbackMessage: 'Please retry' })
    ).toEqual({
      error: {
        status: 502,
        code: 'UPSTREAM_FAILURE',
        message: 'Please retry',
        correlationId: 'cor-456',
        retryable: true,
        details: { query: 'insert' },
      },
    })
  })
})

describe(`Serialization helpers`, () => {
  test(`toJSON includes enriched metadata`, () => {
    const sut = new ApiFunctionError(`Bad input`, { status: 400, code: 'INVALID' })
    expect(sut.toJSON()).toEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          name: 'ApiFunctionError',
          message: 'Bad input',
          status: 400,
          isClientError: true,
          isServerError: false,
          retryable: false,
          code: 'INVALID',
        }),
      })
    )
  })
})

describe(`Static helpers`, () => {
  test(`from rewraps unknown errors and applies overrides`, () => {
    const raw = new TestError(`Boom`)
    const sut = ApiFunctionError.from(raw, { status: 504, code: 'TIMEOUT' })
    expect(sut).toBeInstanceOf(ApiFunctionError)
    expect(sut.status).toBe(504)
    expect(sut.code).toBe('TIMEOUT')

    const existing = new ApiFunctionError(`Bad input`, { status: 422, code: 'INVALID' })
    const clone = ApiFunctionError.from(existing, { code: 'INVALID_EMAIL' })
    expect(clone).not.toBe(existing)
    expect(clone.status).toBe(422)
    expect(clone.code).toBe('INVALID_EMAIL')
  })
})
