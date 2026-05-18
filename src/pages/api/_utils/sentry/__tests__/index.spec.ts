/**
 * Tests for API Sentry bootstrapper
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const sentryInitMock = vi.fn()
const envMocks = vi.hoisted(() => ({
  isProd: vi.fn(() => false),
  getSentryDsn: vi.fn(() => 'https://public@example.ingest.sentry.io/1'),
  getPackageRelease: vi.fn(() => 'pkg@1.0.0'),
}))
const consoleErrorMock = vi.hoisted(() => vi.fn())

vi.mock('@sentry/astro', () => ({
  init: sentryInitMock,
}))

vi.mock('@pages/api/_utils/environment', () => envMocks)

vi.stubGlobal('console', {
  ...console,
  error: consoleErrorMock,
})

describe('ensureApiSentry', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    envMocks.isProd.mockReset()
    envMocks.isProd.mockReturnValue(false)
    envMocks.getSentryDsn.mockReset()
    envMocks.getSentryDsn.mockReturnValue('https://public@example.ingest.sentry.io/1')
    envMocks.getPackageRelease.mockReset()
    envMocks.getPackageRelease.mockReturnValue('pkg@1.0.0')
  })

  it('skips initialization outside production', async () => {
    envMocks.isProd.mockReturnValue(false)

    const module = await import('@pages/api/_utils/sentry')
    module.ensureApiSentry()

    expect(sentryInitMock).not.toHaveBeenCalled()
  })

  it('initializes once when running in production', async () => {
    envMocks.isProd.mockReturnValue(true)

    const module = await import('@pages/api/_utils/sentry')

    expect(sentryInitMock).toHaveBeenCalledTimes(1)
    const initConfig = sentryInitMock.mock.calls[0]![0]
    expect(initConfig).toMatchObject({
      dsn: expect.any(String),
      release: 'pkg@1.0.0',
      environment: 'production',
    })

    module.ensureApiSentry()
    expect(sentryInitMock).toHaveBeenCalledTimes(1)
  })

  it('drops events when prod flag is false', async () => {
    envMocks.isProd.mockReturnValue(true)

    const module = await import('@pages/api/_utils/sentry')
    const config = sentryInitMock.mock.calls[0]![0]

    const event = {}
    expect(config.beforeSend(event as any)).toBe(event)
    envMocks.isProd.mockReturnValue(false)
    expect(config.beforeSend(event as any)).toBeNull()

    module.ensureApiSentry()
    expect(sentryInitMock).toHaveBeenCalledTimes(1)
  })

  it('fails open when production Sentry config is unavailable', async () => {
    envMocks.isProd.mockReturnValue(true)
    envMocks.getSentryDsn.mockImplementation(() => {
      throw new Error('missing dsn')
    })

    const module = await import('@pages/api/_utils/sentry')

    expect(sentryInitMock).not.toHaveBeenCalled()
    expect(consoleErrorMock).toHaveBeenCalledWith(
      '[api] failed to initialize Sentry; continuing without telemetry',
      expect.any(Error)
    )

    module.ensureApiSentry()
    expect(sentryInitMock).not.toHaveBeenCalled()
  })
})
