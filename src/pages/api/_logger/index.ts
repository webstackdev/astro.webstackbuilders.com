/**
 * Shared consent logging helper for server-side API routes
 * Provides a thin wrapper around the GDPR consent endpoint with origin handling
 */
import type { ConsentRequest } from '@pages/api/_contracts/gdpr.contracts'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { recordConsentServerSide } from '@lib/api/gdpr.client'

export type ConsentLogRequest = ConsentRequest & {
  origin: string
}

export const recordConsent = async (request: ConsentLogRequest) => {
  const { origin, ...consentRequest } = request
  const response = await recordConsentServerSide(origin, consentRequest)

  if (!response.success) {
    throw new ApiFunctionError({
      message: response.error.message || 'Failed to record consent.',
      status: response.error.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 502,
      code: response.error.code,
    })
  }

  return response.data
}
