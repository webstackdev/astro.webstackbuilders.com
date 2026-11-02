import { beforeEach, describe, expect, it, vi } from 'vitest'

const sentryInitMock = vi.hoisted(() => vi.fn())
const isProdMock = vi.hoisted(() => vi.fn(() => false))

vi.mock('@sentry/astro', () => ({
  init: sentryInitMock,
}))

vi.mock('@actions/utils/environment/environmentActions', () => ({
  isProd: isProdMock,
  getSentryDsn: () => 'https://public@example.ingest.sentry.io/1',
  getPackageRelease: () => 'pkg@1.0.0',
}))

describe('ensureActionSentry', () => {
  beforeEach(() => {
    vi.resetModules()
    sentryInitMock.mockClear()
    isProdMock.mockReset()
    isProdMock.mockReturnValue(false)
  })

  it('does not initialize outside production', async () => {
    const { ensureActionSentry } = await import('../index')
    ensureActionSentry()
    expect(sentryInitMock).not.toHaveBeenCalled()
  })

  it('initializes once with restrictive server data collection', async () => {
    isProdMock.mockReturnValue(true)
    const { ensureActionSentry } = await import('../index')
    ensureActionSentry()
    ensureActionSentry()

    expect(sentryInitMock).toHaveBeenCalledTimes(1)
    expect(sentryInitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        dataCollection: expect.objectContaining({
          userInfo: false,
          cookies: false,
          httpBodies: [],
          databaseQueryData: false,
          genAI: { inputs: false, outputs: false },
          graphQL: { document: false, variables: false },
        }),
      })
    )
  })
})
