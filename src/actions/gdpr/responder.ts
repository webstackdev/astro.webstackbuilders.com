import type { ConsentEventRecord, ConsentResponse } from '@actions/gdpr/@types'
import { ActionsFunctionError } from '@actions/utils/errors'
import { getPrivacyPolicyVersion } from '@actions/utils/environment/environmentActions'
import {
  normalizeNullableString,
  normalizeUserAgent,
  sanitizePurposes,
  sanitizeSource,
} from '@actions/gdpr/utils'

export const buildRateLimitError = (reset: number | undefined, message?: string) => {
  const retryAfterMs = typeof reset === 'number' ? Math.max(0, reset - Date.now()) : 0
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
  throw new ActionsFunctionError(message ?? `Try again in ${retryAfterSeconds}s`, { status: 429 })
}

export const mapConsentRecord = (record: ConsentEventRecord): ConsentResponse['record'] => {
  const normalizedEmail = normalizeNullableString(record.email)
  const normalizedIpAddress = normalizeNullableString(record.ipAddress)
  const normalizedConsentText = normalizeNullableString(record.consentText)

  const mapped: ConsentResponse['record'] = {
    id: record.id,
    DataSubjectId: record.dataSubjectId,
    purposes: sanitizePurposes(record.purposes),
    timestamp:
      record.createdAt instanceof Date
        ? record.createdAt.toISOString()
        : new Date(record.createdAt).toISOString(),
    source: sanitizeSource(record.source),
    userAgent: normalizeUserAgent(record.userAgent),
    privacyPolicyVersion: record.privacyPolicyVersion ?? getPrivacyPolicyVersion(),
    verified: record.verified,
  }

  if (normalizedEmail) {
    mapped.email = normalizedEmail
  }
  if (normalizedIpAddress) {
    mapped.ipAddress = normalizedIpAddress
  }
  if (normalizedConsentText) {
    mapped.consentText = normalizedConsentText
  }

  return mapped
}
