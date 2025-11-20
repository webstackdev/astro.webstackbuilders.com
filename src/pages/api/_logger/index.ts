/**
 * Shared consent logging helper for server-side API routes
 * Provides a thin wrapper around the GDPR consent endpoint with origin handling
 */
import type { ConsentRequest, ConsentResponse, ErrorResponse } from '@pages/api/_contracts/gdpr.contracts'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'

export type ConsentLogRequest = ConsentRequest & {
  origin: string
}

type ConsentApiResponse = {
  success: true
  data: ConsentResponse
} | {
  success: false
  error: ErrorResponse['error']
}

const recordConsentUpstream = async (origin: string, request: ConsentRequest): Promise<ConsentApiResponse> => {
  try {
    const response = await fetch(`${origin}/api/gdpr/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorResponse = data as ErrorResponse
      return {
        success: false,
        error: errorResponse.error,
      }
    }

    return {
      success: true,
      data: data as ConsentResponse,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Network error',
        code: 'INVALID_REQUEST',
      },
    }
  }
}

export const recordConsent = async (request: ConsentLogRequest) => {
  const { origin, ...consentRequest } = request
  const response = await recordConsentUpstream(origin, consentRequest)

  if (!response.success) {
    throw new ApiFunctionError({
      message: response.error.message || 'Failed to record consent.',
      status: response.error.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 502,
      code: response.error.code,
    })
  }

  return response.data
}
