/**
 * Tests for API Sentry bootstrapper
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const sentryInitMock = vi.fn()
const envMocks = vi.hoisted(() => ({
  isProd: vi.fn(() => false),
  isDev: vi.fn(() => false),
  getSentryDsn: vi.fn(() => 'https://public@example.ingest.sentry.io/1'),
  getPackageRelease: vi.fn(() => 'pkg@1.0.0'),
}))

vi.mock('@sentry/astro', () => ({
  init: sentryInitMock,
}))

vi.mock('@pages/api/_environment/environmentApi', () => envMocks)

describe('ensureApiSentry', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    envMocks.isProd.mockReset()
    envMocks.isDev.mockReset()
    envMocks.isProd.mockReturnValue(false)
    envMocks.isDev.mockReturnValue(false)
  })

  it('skips initialization outside production', async () => {
    envMocks.isProd.mockReturnValue(false)

    const module = await import('@pages/api/_sentry')
    module.ensureApiSentry()

    expect(sentryInitMock).not.toHaveBeenCalled()
  })

  it('initializes once when running in production', async () => {
    envMocks.isProd.mockReturnValue(true)
    envMocks.isDev.mockReturnValue(false)

    const module = await import('@pages/api/_sentry')

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

  it('drops events when dev flag is true', async () => {
    envMocks.isProd.mockReturnValue(true)
    envMocks.isDev.mockReturnValue(true)

    const module = await import('@pages/api/_sentry')
    const config = sentryInitMock.mock.calls[0]![0]

    const event = {}
    expect(config.beforeSend(event as any)).toBeNull()
    envMocks.isDev.mockReturnValue(false)
    expect(config.beforeSend(event as any)).toBe(event)

    module.ensureApiSentry()
    expect(sentryInitMock).toHaveBeenCalledTimes(1)
  })
})
