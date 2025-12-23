import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestError } from '@test/errors'
import {
  recordConsent,
  recordConsentServerSide,
  submitDataRequest,
} from '../gdpr.client'
import type {
  ConsentRequest,
  ConsentResponse,
  DSARRequestInput,
  DSARResponse,
  ErrorResponse,
} from '@actions/_contracts/gdpr.contracts'

const fetchSpy = vi.fn()

const mockFetchResponse = <T>(payload: T, ok = true) => ({
  ok,
  json: vi.fn().mockResolvedValue(payload),
}) as unknown as Response

const consentRequest: ConsentRequest = {
  DataSubjectId: 'user-123',
  email: 'user@example.com',
  purposes: ['analytics'],
  source: 'cookies_modal',
  userAgent: 'jest',
  verified: false,
}

const consentResponse: ConsentResponse = {
  success: true,
  record: {
    id: 'rec_1',
    DataSubjectId: 'user-123',
    email: 'user@example.com',
    purposes: ['analytics'],
    timestamp: '2024-01-01T00:00:00Z',
    source: 'cookies_modal',
    userAgent: 'jest',
    privacyPolicyVersion: '1.0.0',
    verified: false,
    consentText: 'text',
  },
}

const dsarRequest: DSARRequestInput = {
  email: 'user@example.com',
  requestType: 'ACCESS',
}

const dsarResponse: DSARResponse = {
  success: true,
  message: 'Request received',
}

const errorResponse: ErrorResponse = {
  success: false,
  error: {
    code: 'INVALID_REQUEST',
    message: 'Bad request',
  },
}

beforeEach(() => {
  fetchSpy.mockReset()
  globalThis.fetch = fetchSpy as unknown as typeof fetch
})

describe('gdpr.client', () => {
  describe('recordConsent', () => {
    it('returns success payload when API call resolves', async () => {
      fetchSpy.mockResolvedValue(mockFetchResponse(consentResponse))

      const result = await recordConsent(consentRequest)

      expect(fetchSpy).toHaveBeenCalledWith('/api/gdpr/consent', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }))
      expect(JSON.parse((fetchSpy.mock.calls[0]?.[1] as RequestInit).body as string)).toEqual(consentRequest)
      expect(result).toEqual({ success: true, data: consentResponse })
    })

    it('returns error payload when API responds with failure', async () => {
      fetchSpy.mockResolvedValue(mockFetchResponse(errorResponse, false))

      const result = await recordConsent(consentRequest)

      expect(result).toEqual({ success: false, error: errorResponse.error })
    })

    it('returns fallback error when fetch throws', async () => {
      fetchSpy.mockRejectedValue(new TestError('network down'))

      const result = await recordConsent(consentRequest)

      expect(result.success).toBe(false)
      expect(result).toEqual({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'network down',
        },
      })
    })
  })

  describe('submitDataRequest', () => {
    it('hits the DSAR endpoint and returns success payload', async () => {
      fetchSpy.mockResolvedValue(mockFetchResponse(dsarResponse))

      const result = await submitDataRequest(dsarRequest)

      expect(fetchSpy).toHaveBeenCalledWith('/api/gdpr/request-data', expect.any(Object))
      expect(result).toEqual({ success: true, data: dsarResponse })
    })

    it('mirrors error responses from the API', async () => {
      fetchSpy.mockResolvedValue(mockFetchResponse(errorResponse, false))

      const result = await submitDataRequest(dsarRequest)

      expect(result).toEqual({ success: false, error: errorResponse.error })
    })
  })

  describe('recordConsentServerSide', () => {
    it('prefixes the base URL when invoking the consent endpoint', async () => {
      fetchSpy.mockResolvedValue(mockFetchResponse(consentResponse))

      const result = await recordConsentServerSide('https://example.com', consentRequest)

      expect(fetchSpy).toHaveBeenCalledWith('https://example.com/api/gdpr/consent', expect.any(Object))
      expect(result).toEqual({ success: true, data: consentResponse })
    })
  })
})
