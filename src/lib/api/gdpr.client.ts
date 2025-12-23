/**
 * Type-safe GDPR API client functions
 *
 * Provides strongly-typed wrappers around GDPR API endpoints to ensure
 * type safety in client-side code. Uses contract types from the GDPR contracts module
 * for request/response validation.
 */

import type {
  ConsentRequest,
  ConsentResponse,
  DSARRequestInput,
  DSARResponse,
  ErrorResponse
} from '@actions/_contracts/gdpr.contracts'

/**
 * Base API response type that all GDPR endpoints return
 */
type ApiResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: ErrorResponse['error']
}

/**
 * Record user consent for data processing purposes
 *
 * @param request - Consent details including DataSubjectId and purposes
 * @returns Promise resolving to consent record with ID
 *
 * @example
 * ```typescript
 * const result = await recordConsent({
 *   DataSubjectId: 'user-123',
 *   email: 'user@example.com',
 *   purposes: ['analytics', 'marketing'],
 *   source: 'cookies_modal',
 *   userAgent: navigator.userAgent,
 *   verified: false
 * })
 *
 * if (result.success) {
 *   console.log('Consent recorded:', result.data.id)
 * } else {
 *   console.error('Failed:', result.error.message)
 * }
 * ```
 */
export async function recordConsent(
  request: ConsentRequest
): Promise<ApiResponse<ConsentResponse>> {
  try {
    const response = await fetch('/api/gdpr/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorResponse = data as ErrorResponse
      return {
        success: false,
        error: errorResponse.error
      }
    }

    return {
      success: true,
      data: data as ConsentResponse
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Network error',
        code: 'INVALID_REQUEST'
      }
    }
  }
}

/**
 * Request personal data access or deletion (DSAR - Data Subject Access Request)
 *
 * @param request - DSAR details including email and request type
 * @returns Promise resolving to confirmation with next steps
 *
 * @example
 * ```typescript
 * const result = await submitDataRequest({
 *   email: 'user@example.com',
 *   requestType: 'ACCESS'
 * })
 *
 * if (result.success) {
 *   console.log('Request submitted:', result.data.message)
 * } else {
 *   console.error('Failed:', result.error.message)
 * }
 * ```
 */
export async function submitDataRequest(
  request: DSARRequestInput
): Promise<ApiResponse<DSARResponse>> {
  try {
    const response = await fetch('/api/gdpr/request-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorResponse = data as ErrorResponse
      return {
        success: false,
        error: errorResponse.error
      }
    }

    return {
      success: true,
      data: data as DSARResponse
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Network error',
        code: 'INVALID_REQUEST'
      }
    }
  }
}

/**
 * Server-side consent recording helper for internal API endpoints
 *
 * Used by contact/newsletter APIs to record consent with full origin URL.
 * Only for server-side use within API routes.
 *
 * @param baseUrl - Full origin URL from request (e.g., 'https://example.com')
 * @param request - Consent details
 * @returns Promise resolving to consent record
 *
 * @example
 * ```typescript
 * // Inside an API route
 * const result = await recordConsentServerSide(
 *   new URL(request.url).origin,
 *   {
 *     DataSubjectId: 'user-123',
 *     email: 'user@example.com',
 *     purposes: ['contact'],
 *     source: 'contact_form',
 *     userAgent: headers.get('user-agent') || '',
 *     verified: true
 *   }
 * )
 * ```
 */
export async function recordConsentServerSide(
  baseUrl: string,
  request: ConsentRequest
): Promise<ApiResponse<ConsentResponse>> {
  try {
    const response = await fetch(`${baseUrl}/api/gdpr/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorResponse = data as ErrorResponse
      return {
        success: false,
        error: errorResponse.error
      }
    }

    return {
      success: true,
      data: data as ConsentResponse
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Network error',
        code: 'INVALID_REQUEST'
      }
    }
  }
}