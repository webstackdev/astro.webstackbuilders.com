/**
 * Tests for the shared consent logging helper
 */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { recordConsent, type ConsentLogRequest } from '@pages/api/_logger'

const fetchMock = vi.hoisted(() => vi.fn())
vi.stubGlobal('fetch', fetchMock)

const buildFetchResponse = (ok: boolean, payload: unknown) => ({
  ok,
  json: vi.fn().mockResolvedValue(payload),
}) as unknown as Response

const buildRequest = (): ConsentLogRequest => ({
  origin: 'https://example.com',
  DataSubjectId: '1234',
  email: 'user@example.com',
  purposes: ['marketing'],
  source: 'newsletter_form',
  userAgent: 'pytest',
  verified: false,
})

describe('recordConsent helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockReset()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('returns consent data when upstream succeeds', async () => {
    const mockConsent = { id: 'consent-1' }
    fetchMock.mockResolvedValueOnce(buildFetchResponse(true, mockConsent))

    const response = await recordConsent(buildRequest())

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/api/gdpr/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        DataSubjectId: '1234',
        email: 'user@example.com',
        purposes: ['marketing'],
        source: 'newsletter_form',
        userAgent: 'pytest',
        verified: false,
      }),
    })
    expect(response).toBe(mockConsent)
  })

  it('propagates upstream error codes and defaults to 502', async () => {
    fetchMock.mockResolvedValueOnce(buildFetchResponse(false, {
      error: {
        code: 'CONSENT_FAILED',
        message: 'nope',
      },
    }))

    await expect(recordConsent(buildRequest())).rejects.toThrow(ApiFunctionError)
  })

  it('surfaces rate limit overruns with 429', async () => {
    fetchMock.mockResolvedValueOnce(buildFetchResponse(false, {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'too many',
      },
    }))

    await expect(recordConsent(buildRequest())).rejects.toMatchObject({
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
    })
  })
})
