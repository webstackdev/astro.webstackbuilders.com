import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { captureException } from '@sentry/browser'

const isProdMock = vi.hoisted(() => vi.fn(() => false))

vi.mock('@sentry/browser', () => ({
  captureException: vi.fn(),
}))

vi.mock('@components/scripts/utils/environmentClient', () => ({
  isProd: isProdMock,
}))

const captureExceptionMock = vi.mocked(captureException)
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('handleScriptError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isProdMock.mockReturnValue(false)
    consoleErrorSpy.mockClear()
  })

  it('reports exceptions to Sentry when running in production', () => {
    isProdMock.mockReturnValue(true)

    const result = handleScriptError(new Error('boom'), {
      scriptName: 'AppBootstrap',
      operation: 'init',
    })

    expect(result).toBeInstanceOf(ClientScriptError)
    expect(captureExceptionMock).toHaveBeenCalledWith(result, {
      tags: {
        scriptName: 'AppBootstrap',
        operation: 'init',
      },
    })
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('logs errors to the console instead of reporting when not in production', () => {
    const result = handleScriptError('network issue', { scriptName: 'AppBootstrap' })

    expect(result).toBeInstanceOf(ClientScriptError)
    expect(consoleErrorSpy).toHaveBeenCalledWith('[AppBootstrap]:', result)
    expect(captureExceptionMock).not.toHaveBeenCalled()
  })
})
