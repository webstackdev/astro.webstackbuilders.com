import { beforeEach, describe, expect, it, vi } from 'vitest'
import { beforeSendHandler, updateConsentContext } from '../helpers'

const mockScope = {
  setContext: vi.fn(),
}

const isProdMock = vi.hoisted(() => vi.fn(() => true))
const getConsentSnapshotMock = vi.hoisted(() =>
  vi.fn(() => ({
    analytics: true,
  }))
)

vi.mock('@components/scripts/utils/environmentClient', () => ({
  isProd: isProdMock,
}))

vi.mock('@components/scripts/store/consent', () => ({
  getConsentSnapshot: getConsentSnapshotMock,
}))

vi.mock('@sentry/browser', () => ({
  getCurrentScope: () => mockScope,
}))

const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

const createEvent = (): Parameters<typeof beforeSendHandler>[0] =>
  ({
    type: 'error',
    user: { ip_address: '127.0.0.1' },
    request: { headers: { 'user-agent': 'test' } },
    breadcrumbs: [
      { category: 'script', message: 'bootstrap started', data: { scriptName: 'AppBootstrap' } },
      { category: 'fetch', message: 'GET /contact', data: { url: '/contact' } },
    ],
  }) as unknown as Parameters<typeof beforeSendHandler>[0]

const createContactSubmitHttpErrorEvent = (): Parameters<typeof beforeSendHandler>[0] =>
  ({
    type: 'error',
    request: { url: 'https://www.webstackbuilders.com/_actions/contact.submit' },
    exception: {
      values: [
        {
          value: 'HTTP Client Error with status code: 502',
          mechanism: {
            type: 'auto.http.client.fetch',
            handled: false,
          },
        },
      ],
    },
  }) as unknown as Parameters<typeof beforeSendHandler>[0]

const createConsentRateLimitHttpErrorEvent = (): Parameters<typeof beforeSendHandler>[0] =>
  ({
    type: 'error',
    request: { url: 'https://www.webstackbuilders.com/_actions/gdpr/consentCreate' },
    exception: {
      values: [
        {
          value: 'HTTP Client Error with status code: 429',
          mechanism: {
            type: 'auto.http.client.fetch',
            handled: false,
          },
        },
      ],
    },
  }) as unknown as Parameters<typeof beforeSendHandler>[0]

const createConsentCheckpointHttpErrorEvent = (): Parameters<typeof beforeSendHandler>[0] =>
  ({
    type: 'error',
    request: { url: 'https://www.webstackbuilders.com/_actions/gdpr.consentCreate' },
    exception: {
      values: [
        {
          value: 'HTTP Client Error with status code: 403',
          mechanism: {
            type: 'auto.http.client.fetch',
            handled: false,
          },
        },
      ],
    },
  }) as unknown as Parameters<typeof beforeSendHandler>[0]

const createDownloadsSubmitHttpErrorEvent = (): Parameters<typeof beforeSendHandler>[0] =>
  ({
    type: 'error',
    request: { url: 'https://www.webstackbuilders.com/_actions/downloads.submit' },
    exception: {
      values: [
        {
          value: 'HTTP Client Error with status code: 400',
          mechanism: {
            type: 'auto.http.client.fetch',
            handled: false,
          },
        },
      ],
    },
  }) as unknown as Parameters<typeof beforeSendHandler>[0]

const createNewsletterSubscribeHttpErrorEvent = (): Parameters<typeof beforeSendHandler>[0] =>
  ({
    type: 'error',
    request: { url: 'https://www.webstackbuilders.com/_actions/newsletter.subscribe' },
    exception: {
      values: [
        {
          value: 'HTTP Client Error with status code: 500',
          mechanism: {
            type: 'auto.http.client.fetch',
            handled: false,
          },
        },
      ],
    },
  }) as unknown as Parameters<typeof beforeSendHandler>[0]

const createConsentLogRetryErrorEvent = (): Parameters<typeof beforeSendHandler>[0] =>
  ({
    type: 'error',
    message: 'Try again in 30s',
    tags: {
      scriptName: 'cookieConsent',
      operation: 'logConsentToAPI',
    },
    exception: {
      values: [
        {
          value: 'Try again in 30s',
          mechanism: {
            type: 'generic',
            handled: true,
          },
        },
      ],
    },
  }) as unknown as Parameters<typeof beforeSendHandler>[0]

const createConsentCheckpointClientErrorEvent = (): Parameters<typeof beforeSendHandler>[0] =>
  ({
    type: 'error',
    message: '<!DOCTYPE html><title>Vercel Security Checkpoint</title>',
    request: { url: 'https://www.webstackbuilders.com/contact' },
    tags: {
      scriptName: 'cookieConsent',
      operation: 'logConsentToAPI',
    },
    exception: {
      values: [
        {
          value: '<!DOCTYPE html><title>Vercel Security Checkpoint</title>',
          mechanism: {
            type: 'generic',
            handled: true,
          },
        },
      ],
    },
  }) as unknown as Parameters<typeof beforeSendHandler>[0]

const createHint = (): Parameters<typeof beforeSendHandler>[1] =>
  ({}) as Parameters<typeof beforeSendHandler>[1]

describe('sentry helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isProdMock.mockReturnValue(false)
    getConsentSnapshotMock.mockReturnValue({ analytics: true })
    consoleLogSpy.mockClear()
  })

  describe('beforeSendHandler', () => {
    it('skips sending events outside prod', () => {
      isProdMock.mockReturnValue(false)
      const event = createEvent()

      const result = beforeSendHandler(event, createHint())

      expect(result).toBeNull()
      expect(getConsentSnapshotMock).not.toHaveBeenCalled()
    })

    it('returns event unchanged when analytics consent exists', () => {
      isProdMock.mockReturnValue(true)
      getConsentSnapshotMock.mockReturnValue({ analytics: true })

      const event = createEvent()
      const result = beforeSendHandler(event, createHint())

      expect(result).toBe(event)
      expect(event.user?.ip_address).toBe('127.0.0.1')
      expect(event.request?.headers).toEqual({ 'user-agent': 'test' })
      expect(event.breadcrumbs).toEqual([
        { category: 'script', message: 'bootstrap started', data: { scriptName: 'AppBootstrap' } },
        { category: 'fetch', message: 'GET /contact', data: { url: '/contact' } },
      ])
    })

    it('drops handled contact action http client failures', () => {
      isProdMock.mockReturnValue(true)
      getConsentSnapshotMock.mockReturnValue({ analytics: true })

      const event = createContactSubmitHttpErrorEvent()

      const result = beforeSendHandler(event, createHint())

      expect(result).toBeNull()
    })

    it('drops handled consent rate-limit http client failures', () => {
      isProdMock.mockReturnValue(true)
      getConsentSnapshotMock.mockReturnValue({ analytics: true })

      const event = createConsentRateLimitHttpErrorEvent()

      const result = beforeSendHandler(event, createHint())

      expect(result).toBeNull()
    })

    it('drops handled consent checkpoint http client failures', () => {
      isProdMock.mockReturnValue(true)
      getConsentSnapshotMock.mockReturnValue({ analytics: true })

      const event = createConsentCheckpointHttpErrorEvent()

      const result = beforeSendHandler(event, createHint())

      expect(result).toBeNull()
    })

    it('drops handled downloads action http client failures', () => {
      isProdMock.mockReturnValue(true)
      getConsentSnapshotMock.mockReturnValue({ analytics: true })

      const event = createDownloadsSubmitHttpErrorEvent()

      const result = beforeSendHandler(event, createHint())

      expect(result).toBeNull()
    })

    it('drops handled newsletter action http client failures', () => {
      isProdMock.mockReturnValue(true)
      getConsentSnapshotMock.mockReturnValue({ analytics: true })

      const event = createNewsletterSubscribeHttpErrorEvent()

      const result = beforeSendHandler(event, createHint())

      expect(result).toBeNull()
    })

    it('drops handled consent log retry errors', () => {
      isProdMock.mockReturnValue(true)
      getConsentSnapshotMock.mockReturnValue({ analytics: true })

      const event = createConsentLogRetryErrorEvent()

      const result = beforeSendHandler(event, createHint())

      expect(result).toBeNull()
    })

    it('drops handled consent checkpoint client errors', () => {
      isProdMock.mockReturnValue(true)
      getConsentSnapshotMock.mockReturnValue({ analytics: true })

      const event = createConsentCheckpointClientErrorEvent()

      const result = beforeSendHandler(event, createHint())

      expect(result).toBeNull()
    })

    it('scrubs PII when analytics consent is missing and preserves safe breadcrumbs', () => {
      isProdMock.mockReturnValue(true)
      getConsentSnapshotMock.mockReturnValue({ analytics: false })

      const event = createEvent()
      const result = beforeSendHandler(event, createHint())

      expect(result).toBe(event)
      expect(event.user?.ip_address).toBeUndefined()
      expect(event.request?.headers).toBeUndefined()
      expect(event.breadcrumbs).toEqual([
        {
          category: 'script',
          message: 'bootstrap started',
          data: undefined,
        },
      ])
    })
  })

  describe('updateConsentContext', () => {
    it('sets consent context and logs status', () => {
      updateConsentContext(true)

      expect(mockScope.setContext).toHaveBeenCalledWith('consent', {
        analytics: true,
        timestamp: expect.any(String),
      })
      expect(consoleLogSpy).toHaveBeenCalledWith('🔒 Sentry PII enabled based on analytics consent')
    })
  })
})
