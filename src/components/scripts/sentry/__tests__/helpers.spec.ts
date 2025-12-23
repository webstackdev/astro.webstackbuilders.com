import { beforeEach, describe, expect, it, vi } from 'vitest'
import { beforeSendHandler, updateConsentContext } from '../helpers'

const mockScope = {
  setContext: vi.fn(),
}

const isProdMock = vi.hoisted(() => vi.fn(() => true))
const getConsentSnapshotMock = vi.hoisted(() => vi.fn(() => ({
  analytics: true,
})))

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

const createEvent = (): Parameters<typeof beforeSendHandler>[0] => ({
  type: 'error',
  user: { 'ip_address': '127.0.0.1' },
  request: { headers: { 'user-agent': 'test' } },
  breadcrumbs: [{ message: 'clicked' }],
}) as unknown as Parameters<typeof beforeSendHandler>[0]

const createHint = (): Parameters<typeof beforeSendHandler>[1] => ({}) as Parameters<typeof beforeSendHandler>[1]

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
      expect(event.breadcrumbs).toHaveLength(1)
    })

    it('scrubs PII when analytics consent is missing', () => {
      isProdMock.mockReturnValue(true)
      getConsentSnapshotMock.mockReturnValue({ analytics: false })

      const event = createEvent()
      const result = beforeSendHandler(event, createHint())

      expect(result).toBe(event)
      expect(event.user?.ip_address).toBeUndefined()
      expect(event.request?.headers).toBeUndefined()
      expect(event.breadcrumbs).toHaveLength(0)
    })
  })

  describe('updateConsentContext', () => {
    it('sets consent context and logs status', () => {
      updateConsentContext(true)

      expect(mockScope.setContext).toHaveBeenCalledWith('consent', {
        analytics: true,
        timestamp: expect.any(String),
      })
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🔒 Sentry PII enabled based on analytics consent'
      )
    })
  })
})
