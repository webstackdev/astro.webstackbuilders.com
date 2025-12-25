import emailValidator from 'email-validator'
import { validate as uuidValidate } from 'uuid'
import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { getPrivacyPolicyVersion } from '@actions/utils/environment/environmentActions'
import { checkRateLimit, rateLimiters } from '@actions/utils/rateLimit'
import { buildRequestFingerprint, createRateLimitIdentifier } from '@actions/utils/requestContext'
import type {
  ConsentRequest,
  ConsentResponse,
  DSARRequest,
  DSARRequestInput,
  DSARResponse
} from '@actions/gdpr/@types'
import {
  createConsentRecord,
  deleteConsentRecords,
  deleteConsentRecordsByEmail,
  findConsentRecords,
  findConsentRecordsByEmail,
  type ConsentEventRecord,
} from '@actions/gdpr/domain/consentStore'
import {
  createDsarRequest,
  findActiveRequestByEmail,
  findDsarRequestByToken,
  markDsarRequestFulfilled,
} from '@actions/gdpr/domain/dsarStore'
import { sendDsarVerificationEmail } from '@actions/gdpr/_dsarVerificationEmails'
import { deleteNewsletterConfirmationsByEmail } from '@actions/newsletter/_action'

const CONSENT_PURPOSES = ['contact', 'marketing', 'analytics', 'downloads'] as const
type ConsentPurpose = (typeof CONSENT_PURPOSES)[number]

const CONSENT_SOURCES = ['contact_form', 'newsletter_form', 'download_form', 'cookies_modal', 'preferences_page'] as const
type ConsentSource = (typeof CONSENT_SOURCES)[number]

const DEFAULT_SOURCE: ConsentSource = 'cookies_modal'
const DEFAULT_USER_AGENT = 'unknown'

const isConsentPurpose = (value: unknown): value is ConsentPurpose =>
  typeof value === 'string' && CONSENT_PURPOSES.includes(value as ConsentPurpose)

const isConsentSource = (value: unknown): value is ConsentSource =>
  typeof value === 'string' && CONSENT_SOURCES.includes(value as ConsentSource)

const sanitizePurposes = (purposes: unknown): ConsentPurpose[] => (Array.isArray(purposes) ? purposes.filter(isConsentPurpose) : [])
const sanitizeSource = (source: unknown): ConsentSource => (isConsentSource(source) ? source : DEFAULT_SOURCE)

const normalizeNullableString = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizeUserAgent = (value?: string | null): string => normalizeNullableString(value) ?? DEFAULT_USER_AGENT

const buildRateLimitError = (reset: number | undefined, message?: string) => {
  const retryAfterMs = typeof reset === 'number' ? Math.max(0, reset - Date.now()) : 0
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
  throw new ActionError({
    code: 'TOO_MANY_REQUESTS',
    message: message ?? `Try again in ${retryAfterSeconds}s`,
  })
}

const mapConsentRecord = (record: ConsentEventRecord): ConsentResponse['record'] => {
  const normalizedEmail = normalizeNullableString(record.email)
  const normalizedIpAddress = normalizeNullableString(record.ipAddress)
  const normalizedConsentText = normalizeNullableString(record.consentText)

  const mapped: ConsentResponse['record'] = {
    id: record.id,
    DataSubjectId: record.dataSubjectId,
    purposes: sanitizePurposes(record.purposes),
    timestamp: record.createdAt instanceof Date ? record.createdAt.toISOString() : new Date(record.createdAt).toISOString(),
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

const consentCreateSchema = z.custom<ConsentRequest>()
const consentListSchema = z.object({
  DataSubjectId: z.string().min(1),
  purpose: z.string().optional(),
})
const consentDeleteSchema = z.object({
  DataSubjectId: z.string().min(1),
})

const dsarRequestSchema = z.object({
  email: z.string().min(1),
  requestType: z.enum(['ACCESS', 'DELETE']),
})

export type DsarVerifyResult =
  | { status: 'invalid' | 'expired' | 'already-completed' | 'error' }
  | { status: 'deleted' }
  | { status: 'download'; filename: string; json: string }

export async function verifyDsarToken(token: string): Promise<DsarVerifyResult> {
  const dbRequest = await findDsarRequestByToken(token)

  if (!dbRequest) {
    return { status: 'invalid' }
  }

  const dsarRequest: DSARRequest = {
    id: dbRequest.id,
    token: dbRequest.token,
    email: dbRequest.email,
    requestType: dbRequest.requestType as DSARRequest['requestType'],
    expiresAt: dbRequest.expiresAt.toISOString(),
    createdAt: dbRequest.createdAt.toISOString(),
    ...(dbRequest.fulfilledAt && { fulfilledAt: dbRequest.fulfilledAt.toISOString() }),
  }

  if (dsarRequest.fulfilledAt) {
    return { status: 'already-completed' }
  }

  if (new Date(dsarRequest.expiresAt) < new Date()) {
    return { status: 'expired' }
  }

  const email = dsarRequest.email
  const requestType = dsarRequest.requestType

  if (requestType === 'ACCESS') {
    const consentRecords = await findConsentRecordsByEmail(email)
    await markDsarRequestFulfilled(token)

    const exportData = {
      email,
      requestDate: dsarRequest.createdAt,
      consentRecords: consentRecords.map(({ ipAddress: _ip, ...record }) => ({
        ...record,
        createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
      })),
    }

    return {
      status: 'download',
      filename: `my-data-${Date.now()}.json`,
      json: JSON.stringify(exportData, null, 2),
    }
  }

  if (requestType === 'DELETE') {
    await deleteConsentRecordsByEmail(email)
    await deleteNewsletterConfirmationsByEmail(email)
    await markDsarRequestFulfilled(token)
    return { status: 'deleted' }
  }

  return { status: 'error' }
}

export const gdpr = {
  verifyDsar: defineAction({
    accept: 'json',
    input: z.object({ token: z.string().min(1) }),
    handler: async (input, context): Promise<DsarVerifyResult> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/gdpr/verifyDsar',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('gdpr:dsar:verify', fingerprint)
      const { success, reset } = await checkRateLimit(rateLimiters.export, rateLimitIdentifier)
      if (!success) {
        buildRateLimitError(reset, 'Too many requests')
      }

      try {
        return await verifyDsarToken(input.token)
      } catch (error) {
        console.error('[gdpr.verifyDsar] failed:', error)
        return { status: 'error' }
      }
    },
  }),

  consentCreate: defineAction({
    accept: 'json',
    input: consentCreateSchema,
    handler: async (body, context): Promise<ConsentResponse> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/gdpr/consentCreate',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('gdpr:consent:post', fingerprint)
      const { success, reset } = await checkRateLimit(rateLimiters.consent, rateLimitIdentifier)
      if (!success) {
        buildRateLimitError(reset)
      }

      if (!uuidValidate(body.DataSubjectId)) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Invalid DataSubjectId' })
      }

      const normalizedEmail = normalizeNullableString(body.email ?? null)
      const normalizedPurposes = sanitizePurposes(body.purposes)
      const normalizedSource = sanitizeSource(body.source)
      const normalizedUserAgent = normalizeUserAgent(body.userAgent)
      const normalizedIpAddress = normalizeNullableString(body.ipAddress ?? null)
      const normalizedConsentText = normalizeNullableString(body.consentText ?? null)

      const dbRecord = await createConsentRecord({
        dataSubjectId: body.DataSubjectId,
        email: normalizedEmail,
        purposes: normalizedPurposes,
        source: normalizedSource,
        userAgent: normalizedUserAgent,
        ipAddress: normalizedIpAddress,
        privacyPolicyVersion: getPrivacyPolicyVersion(),
        consentText: normalizedConsentText,
        verified: body.verified ?? false,
      })

      return {
        success: true,
        record: mapConsentRecord(dbRecord),
      }
    },
  }),

  consentList: defineAction({
    accept: 'json',
    input: consentListSchema,
    handler: async (input, context): Promise<{ success: true; records: ConsentResponse['record'][]; hasActive?: boolean; activeRecord?: ConsentResponse['record'] }> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/gdpr/consentList',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('gdpr:consent:get', fingerprint)
      const { success, reset } = await checkRateLimit(rateLimiters.consentRead, rateLimitIdentifier)
      if (!success) {
        buildRateLimitError(reset)
      }

      const { DataSubjectId, purpose } = input

      if (!DataSubjectId || !uuidValidate(DataSubjectId)) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Valid DataSubjectId required' })
      }

      const fetched = await findConsentRecords(DataSubjectId)
      const filteredRecords = purpose ? fetched.filter(record => record.purposes.includes(purpose)) : fetched
      const records = filteredRecords.map(mapConsentRecord)

      const response: {
        success: true
        records: ConsentResponse['record'][]
        hasActive?: boolean
        activeRecord?: ConsentResponse['record']
      } = {
        success: true,
        records,
      }

      if (purpose) {
        response.hasActive = records.length > 0
        if (records[0]) {
          response.activeRecord = records[0]
        }
      }

      return response
    },
  }),

  consentDelete: defineAction({
    accept: 'json',
    input: consentDeleteSchema,
    handler: async (input, context): Promise<{ success: true; deletedCount: number }> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/gdpr/consentDelete',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('gdpr:consent:delete', fingerprint)
      const { success, reset } = await checkRateLimit(rateLimiters.delete, rateLimitIdentifier)
      if (!success) {
        buildRateLimitError(reset)
      }

      if (!uuidValidate(input.DataSubjectId)) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Valid DataSubjectId required' })
      }

      const deletedCount = await deleteConsentRecords(input.DataSubjectId)
      return { success: true, deletedCount }
    },
  }),

  requestData: defineAction({
    accept: 'json',
    input: dsarRequestSchema,
    handler: async (input: DSARRequestInput, context): Promise<DSARResponse> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/gdpr/requestData',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('gdpr:dsar:request', fingerprint)
      const { success, reset } = await checkRateLimit(rateLimiters.export, rateLimitIdentifier)
      if (!success) {
        buildRateLimitError(reset, 'Too many requests. Try again later.')
      }

      if (!emailValidator.validate(input.email)) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Invalid email format' })
      }

      const email = input.email.toLowerCase().trim()
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const existing = await findActiveRequestByEmail(email, input.requestType)

      if (existing) {
        await sendDsarVerificationEmail(email, existing.token, input.requestType)
        return {
          success: true,
          message: 'Verification email sent. Please check your inbox.',
        }
      }

      await createDsarRequest({
        token,
        email,
        requestType: input.requestType,
        expiresAt,
      })

      await sendDsarVerificationEmail(email, token, input.requestType)

      return {
        success: true,
        message:
          'Verification email sent. Please check your inbox and click the link to complete your request.',
      }
    },
  }),

  exportByDataSubjectId: defineAction({
    accept: 'json',
    input: z.object({ DataSubjectId: z.string().min(1) }),
    handler: async (input, context): Promise<{ success: true; json: string; filename: string }> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/gdpr/exportByDataSubjectId',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('gdpr:export:get', fingerprint)
      const { success, reset } = await checkRateLimit(rateLimiters.export, rateLimitIdentifier)
      if (!success) {
        buildRateLimitError(reset)
      }

      if (!uuidValidate(input.DataSubjectId)) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Invalid DataSubjectId' })
      }

      const consentRecords = await findConsentRecords(input.DataSubjectId)
      const exportData = consentRecords.map(record => ({
        id: record.id,
        'data_subject_id': record.dataSubjectId,
        email: record.email,
        purposes: record.purposes,
        source: record.source,
        'user_agent': record.userAgent,
        'privacy_policy_version': record.privacyPolicyVersion,
        'consent_text': record.consentText,
        verified: record.verified,
        'created_at': record.createdAt.toISOString(),
      }))

      return {
        success: true,
        filename: `my-data-${Date.now()}.json`,
        json: JSON.stringify(exportData, null, 2),
      }
    },
  }),
}
