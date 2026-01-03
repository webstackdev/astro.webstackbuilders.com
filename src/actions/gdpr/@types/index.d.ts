/**
 * GDPR Actions Types
 *
 * Type definitions for GDPR-related Astro Actions.
 */
import { consentEvents, dsarRequests } from 'astro:db'

export type DbConsentRecord = typeof consentEvents.$inferSelect

export type ConsentEventRecord = Omit<DbConsentRecord, 'purposes'> & {
  purposes: string[]
}

export type CreateConsentRecordInput = {
  dataSubjectId: string
  email: string | null
  purposes: string[]
  source: string
  userAgent: string
  ipAddress: string | null
  privacyPolicyVersion: string
  consentText: string | null
  verified: boolean
}

export interface ConsentRecord {
  id: string
  DataSubjectId: string
  email?: string
  purposes: Array<'contact' | 'marketing' | 'analytics' | 'downloads'>
  timestamp: string
  source:
    | 'contact_form'
    | 'newsletter_form'
    | 'download_form'
    | 'cookies_modal'
    | 'preferences_page'
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

export const CONSENT_PURPOSES = ['contact', 'marketing', 'analytics', 'downloads'] as const

export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number]

export const CONSENT_SOURCES = [
  'contact_form',
  'newsletter_form',
  'download_form',
  'cookies_modal',
  'preferences_page',
] as const

export type ConsentSource = (typeof CONSENT_SOURCES)[number]

export interface DSARVerificationEmailPropsText {
  requestType: 'ACCESS' | 'DELETE'
  actionText: string
  verifyUrl: string
  expiresIn: string
}

export type DsarVerifyResult =
  | { status: 'invalid' | 'expired' | 'already-completed' | 'error' }
  | { status: 'deleted' }
  | { status: 'download'; filename: string; json: string }

export interface DSARVerificationEmailPropsHtml extends DSARVerificationEmailPropsText {
  subject: string
}

export type DsarRequestRecord = typeof dsarRequests.$inferSelect

export type RequestType = DSARRequestInput['requestType']

export type CreateDsarRequestInput = {
  token: string
  email: string
  requestType: RequestType
  expiresAt: Date
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
