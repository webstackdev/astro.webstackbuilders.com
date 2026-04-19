import { beforeEach, describe, expect, it, vi } from 'vitest'

const captureExceptionMock = vi.fn()
const setTagsMock = vi.fn()
const setTagMock = vi.fn()
const setExtrasMock = vi.fn()
const withScopeMock = vi.fn((callback: (_scope: unknown) => void) => {
  callback({
    setTags: setTagsMock,
    setTag: setTagMock,
    setExtras: setExtrasMock,
  })
})

vi.mock('astro:actions', () => {
  class ActionError extends Error {
    code: string

    constructor(options: { code: string; message: string }) {
      super(options.message)
      this.name = 'ActionError'
      this.code = options.code
    }
  }

  return { ActionError }
})

vi.mock('@actions/utils/environment/environmentActions', () => ({
  isDev: () => true,
  isProd: () => false,
  isTest: () => false,
  isUnitTest: () => true,
}))

vi.mock('@actions/utils/sentry', () => ({
  ensureActionSentry: () => undefined,
}))

vi.mock('@sentry/astro', () => ({
  captureException: captureExceptionMock,
  withScope: withScopeMock,
}))

beforeEach(() => {
  captureExceptionMock.mockReset()
  setTagsMock.mockReset()
  setTagMock.mockReset()
  setExtrasMock.mockReset()
  withScopeMock.mockClear()
})

describe('actionsFunctionHandler', () => {
  it('converts server errors into ActionError with fallback message', async () => {
    const { ActionsFunctionError } = await import('../ActionsFunctionError')
    const { toActionError } = await import('../actionsFunctionHandler')

    const err = new ActionsFunctionError('DB exploded', { status: 500, route: 'actions:test' })
    const actionError = toActionError(err, { fallbackMessage: 'Something went wrong' })

    expect(actionError).toBeInstanceOf(Error)
    expect(actionError.name).toBe('ActionError')
    expect((actionError as unknown as { code: string }).code).toBe('INTERNAL_SERVER_ERROR')
    expect(actionError.message).toBe('Something went wrong')
  })

  it('preserves client error messages', async () => {
    const { ActionsFunctionError } = await import('../ActionsFunctionError')
    const { toActionError } = await import('../actionsFunctionHandler')

    const err = new ActionsFunctionError('Bad input', { status: 400, route: 'actions:test' })
    const actionError = toActionError(err)

    expect((actionError as unknown as { code: string }).code).toBe('BAD_REQUEST')
    expect(actionError.message).toBe('Bad input')
  })

  it('wraps unknown thrown values into ActionsFunctionError', async () => {
    const { handleActionsFunctionError } = await import('../actionsFunctionHandler')

    const normalized = handleActionsFunctionError('boom', { route: 'actions:test' })

    expect(normalized.name).toBe('ActionsFunctionError')
    expect(normalized.status).toBe(500)
    expect(normalized.message).toBe('boom')
  })

  it('includes merged details in structured logs', async () => {
    const { ActionsFunctionError } = await import('../ActionsFunctionError')
    const { formatActionsErrorLogEntry } = await import('../actionsFunctionHandler')

    const error = new ActionsFunctionError('DB exploded', {
      status: 500,
      route: 'actions:test',
      appCode: 'DB_WRITE_FAILED',
      details: { stage: 'createPendingSubscription' },
    })

    const entry = formatActionsErrorLogEntry(error, {
      route: 'actions:test',
      operation: 'subscribe',
      extra: { fingerprint: 'fingerprint-1' },
    })

    expect(entry.appCode).toBe('DB_WRITE_FAILED')
    expect(entry.details).toEqual({
      stage: 'createPendingSubscription',
      fingerprint: 'fingerprint-1',
    })
  })

  it('forwards merged details and appCode to sentry in production', async () => {
    vi.resetModules()

    vi.doMock('@actions/utils/environment/environmentActions', () => ({
      isDev: () => false,
      isProd: () => true,
      isTest: () => false,
      isUnitTest: () => false,
    }))

    const { ActionsFunctionError } = await import('../ActionsFunctionError')
    const { handleActionsFunctionError } = await import('../actionsFunctionHandler')

    const error = new ActionsFunctionError('DB exploded', {
      status: 500,
      route: 'actions:test',
      appCode: 'DB_WRITE_FAILED',
      details: { stage: 'persist' },
    })

    const normalized = handleActionsFunctionError(error, {
      route: 'actions:test',
      operation: 'subscribe',
      extra: { fingerprint: 'fingerprint-1' },
    })

    expect(normalized).toBeInstanceOf(ActionsFunctionError)
    expect(setTagsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        route: 'actions:test',
        status: '500',
        retryable: 'true',
        appCode: 'DB_WRITE_FAILED',
        operation: 'subscribe',
      })
    )
    expect(setExtrasMock).toHaveBeenCalledWith({
      stage: 'persist',
      fingerprint: 'fingerprint-1',
    })
    expect(captureExceptionMock).toHaveBeenCalledWith(expect.any(ActionsFunctionError))
  })
})
