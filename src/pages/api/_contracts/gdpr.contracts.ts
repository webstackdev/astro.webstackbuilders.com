/**
 * GDPR API Endpoint Types
 *
 * This file contains TypeScript type definitions for the GDPR-related API endpoints.
 * These types serve as a contract between the API endpoints and their consumers,
 * providing type safety without requiring Swagger/OpenAPI schema generation.
 *
 * Each interface represents either:
 * - Request payloads sent to the API
 * - Response payloads returned by the API
 * - Database record structures
 *
 * Used by:
 * - /api/gdpr/consent (ConsentRequest, ConsentResponse, ErrorResponse)
 * - /api/gdpr/request-data (DSARRequestInput, DSARResponse, ErrorResponse)
 * - /api/gdpr/verify (ErrorResponse)
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
    code: 'INVALID_UUID' | 'RATE_LIMIT_EXCEEDED' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'INVALID_REQUEST'
    message: string
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