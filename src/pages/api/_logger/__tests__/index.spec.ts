/**
 * Tests for the shared consent logging helper
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { recordConsent, type ConsentLogRequest } from '@pages/api/_logger'

const recordConsentServerSideMock = vi.hoisted(() => vi.fn())

vi.mock('@lib/api/gdpr.client', () => ({
  recordConsentServerSide: recordConsentServerSideMock,
}))

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
    recordConsentServerSideMock.mockReset()
  })

  it('returns consent data when upstream succeeds', async () => {
    const mockConsent = { id: 'consent-1' }
    recordConsentServerSideMock.mockResolvedValueOnce({
      success: true,
      data: mockConsent,
    })

    const response = await recordConsent(buildRequest())

    expect(recordConsentServerSideMock).toHaveBeenCalledWith('https://example.com', {
      DataSubjectId: '1234',
      email: 'user@example.com',
      purposes: ['marketing'],
      source: 'newsletter_form',
      userAgent: 'pytest',
      verified: false,
    })
    expect(response).toBe(mockConsent)
  })

  it('propagates upstream error codes and defaults to 502', async () => {
    recordConsentServerSideMock.mockResolvedValueOnce({
      success: false,
      error: {
        code: 'CONSENT_FAILED',
        message: 'nope',
      },
    })

    await expect(recordConsent(buildRequest())).rejects.toThrow(ApiFunctionError)
  })

  it('surfaces rate limit overruns with 429', async () => {
    recordConsentServerSideMock.mockResolvedValueOnce({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'too many',
      },
    })

    await expect(recordConsent(buildRequest())).rejects.toMatchObject({
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
    })
  })
})
