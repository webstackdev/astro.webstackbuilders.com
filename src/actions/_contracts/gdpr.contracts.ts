/**
 * GDPR Actions Types
 *
 * Type definitions for GDPR-related Astro Actions.
 */

export interface ConsentRecord {
  id: string
  DataSubjectId: string
  email?: string
  purposes: Array<'contact' | 'marketing' | 'analytics' | 'downloads'>
  timestamp: string
  source: 'contact_form' | 'newsletter_form' | 'download_form' | 'cookies_modal' | 'preferences_page'
  userAgent: string
  ipAddress?: string
  privacyPolicyVersion: string
  consentText?: string
  verified: boolean
}

export interface ConsentRequest {
  DataSubjectId: string
  email?: string
  purposes: Array<'contact' | 'marketing' | 'analytics' | 'downloads'>
  source: string
  userAgent: string
  ipAddress?: string
  consentText?: string
  verified?: boolean
}

export interface ConsentResponse {
  success: true
  record: ConsentRecord
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    requestId?: string
    correlationId?: string
    retryable?: boolean
    details?: Record<string, unknown>
  }
}

export interface DSARRequest {
  id: string
  token: string
  email: string
  requestType: 'ACCESS' | 'DELETE'
  expiresAt: string
  fulfilledAt?: string
  createdAt: string
}

export interface DSARRequestInput {
  email: string
  requestType: 'ACCESS' | 'DELETE'
}

export interface DSARResponse {
  success: true
  message: string
}
