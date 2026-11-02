import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BrowserOptions } from '@sentry/browser'
import { SentryBootstrap } from '../client'

const initMock = vi.hoisted(() => vi.fn<(_options: BrowserOptions) => void>())
const consentMock = vi.hoisted(() => vi.fn(() => false))

vi.mock('@sentry/browser', () => ({
  init: initMock,
  breadcrumbsIntegration: () => ({ name: 'Breadcrumbs' }),
  consoleIntegration: () => ({ name: 'Console' }),
  dedupeIntegration: () => ({ name: 'Dedupe' }),
  feedbackIntegration: () => ({ name: 'Feedback' }),
  globalHandlersIntegration: () => ({ name: 'GlobalHandlers' }),
  httpClientIntegration: () => ({ name: 'HttpClient' }),
  linkedErrorsIntegration: () => ({ name: 'LinkedErrors' }),
  defaultStackParser: vi.fn(),
  makeFetchTransport: vi.fn(),
}))

vi.mock('@components/scripts/store/consent', () => ({
  getAnalyticsConsentPreference: consentMock,
}))

vi.mock('@components/scripts/utils/environmentClient', () => ({
  getPackageRelease: () => 'pkg@1.0.0',
  getSentryDsn: () => 'https://public@example.ingest.sentry.io/1',
}))

vi.mock('@components/scripts/sentry/helpers', () => ({
  beforeSendHandler: vi.fn(),
}))

describe('SentryBootstrap', () => {
  beforeEach(() => {
    initMock.mockClear()
    consentMock.mockReset()
    consentMock.mockReturnValue(false)
  })

  it('preserves restrictive collection and console breadcrumbs without consent', () => {
    SentryBootstrap.init()

    const options = initMock.mock.calls[0]?.[0]
    expect(options?.dataCollection).toMatchObject({
      userInfo: false,
      cookies: false,
      httpBodies: [],
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      graphQL: { document: false, variables: false },
    })
    expect(options?.dataCollection?.httpHeaders).toEqual({
      request: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
      response: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
    })
    expect(options?.integrations).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Console' })])
    )
  })

  it('enables default data collection when analytics consent exists', () => {
    consentMock.mockReturnValue(true)

    SentryBootstrap.init()

    expect(initMock.mock.calls[0]?.[0].dataCollection).toEqual({ userInfo: true })
  })
})
