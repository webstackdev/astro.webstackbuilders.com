import { describe, expect, it, vi } from 'vitest'

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
  captureException: () => undefined,
  withScope: (_fn: (_scope: unknown) => void) => undefined,
}))

describe('actionsFunctionHandler', () => {
  it('converts server errors into ActionError with fallback message', async () => {
    const { ActionsFunctionError } = await import('../ActionFunctionError')
    const { toActionError } = await import('../actionsFunctionHandler')

    const err = new ActionsFunctionError('DB exploded', { status: 500, route: 'actions:test' })
    const actionError = toActionError(err, { fallbackMessage: 'Something went wrong' })

    expect(actionError).toBeInstanceOf(Error)
    expect(actionError.name).toBe('ActionError')
    expect((actionError as unknown as { code: string }).code).toBe('INTERNAL_SERVER_ERROR')
    expect(actionError.message).toBe('Something went wrong')
  })

  it('preserves client error messages', async () => {
    const { ActionsFunctionError } = await import('../ActionFunctionError')
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
})
