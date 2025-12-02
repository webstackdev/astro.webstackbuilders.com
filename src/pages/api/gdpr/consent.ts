import { randomUUID } from 'node:crypto'
import type { APIRoute } from 'astro'
import { getPrivacyPolicyVersion, isSupabaseFallbackEnabled } from '@pages/api/_environment/environmentApi'
import { rateLimiters, checkRateLimit, supabaseAdmin } from '@pages/api/_utils'
import { validate as uuidValidate } from 'uuid'
import type { ConsentRequest, ConsentResponse } from '@pages/api/_contracts/gdpr.contracts'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
import { createApiFunctionContext, createRateLimitIdentifier } from '@pages/api/_utils/requestContext'

export const prerender = false // Force SSR for this endpoint

const ROUTE = '/api/gdpr/consent'

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

const sanitizePurposes = (purposes: unknown): ConsentPurpose[] =>
  Array.isArray(purposes) ? purposes.filter(isConsentPurpose) : []

const sanitizeSource = (source: unknown): ConsentSource => (isConsentSource(source) ? source : DEFAULT_SOURCE)

const normalizeNullableString = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizeUserAgent = (value?: string | null): string => normalizeNullableString(value) ?? DEFAULT_USER_AGENT

type ConsentRecordRow = {
  id: string
  data_subject_id: string
  email: string | null
  purposes: string[]
  timestamp: string
  source: string | null
  user_agent: string | null
  ip_address: string | null
  privacy_policy_version: string | null
  consent_text: string | null
  verified: boolean
}

const jsonResponse = (body: unknown, status: number, headers?: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  })

const buildRateLimitError = (reset: number | undefined, message?: string) => {
  const retryAfterMs = typeof reset === 'number' ? Math.max(0, reset - Date.now()) : 0
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
  return new ApiFunctionError({
    message: message ?? `Try again in ${retryAfterSeconds}s`,
    status: 429,
    code: 'RATE_LIMIT_EXCEEDED',
    details: { retryAfterSeconds },
  })
}

const mapConsentRecord = (record: ConsentRecordRow): ConsentResponse['record'] => {
  const normalizedEmail = normalizeNullableString(record.email)
  const normalizedIpAddress = normalizeNullableString(record.ip_address)
  const normalizedConsentText = normalizeNullableString(record.consent_text)

  const mapped: ConsentResponse['record'] = {
    id: record.id,
    DataSubjectId: record.data_subject_id,
    purposes: sanitizePurposes(record.purposes),
    timestamp: record.timestamp,
    source: sanitizeSource(record.source),
    userAgent: normalizeUserAgent(record.user_agent),
    privacyPolicyVersion: record.privacy_policy_version ?? getPrivacyPolicyVersion(),
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

const buildMockConsentRecord = (body: ConsentRequest): ConsentResponse['record'] => {
  const normalizedEmail = normalizeNullableString(body.email ?? null)
  const normalizedIpAddress = normalizeNullableString(body.ipAddress ?? null)
  const normalizedConsentText = normalizeNullableString(body.consentText ?? null)

  const mockRecord: ConsentResponse['record'] = {
    id: randomUUID(),
    DataSubjectId: body.DataSubjectId,
    purposes: sanitizePurposes(body.purposes),
    timestamp: new Date().toISOString(),
    source: sanitizeSource(body.source),
    userAgent: normalizeUserAgent(body.userAgent),
    privacyPolicyVersion: getPrivacyPolicyVersion(),
    verified: body.verified ?? false,
  }

  if (normalizedEmail) {
    mockRecord.email = normalizedEmail
  }
  if (normalizedIpAddress) {
    mockRecord.ipAddress = normalizedIpAddress
  }
  if (normalizedConsentText) {
    mockRecord.consentText = normalizedConsentText
  }

  return mockRecord
}

const buildErrorResponse = (
  error: unknown,
  context: ReturnType<typeof createApiFunctionContext>['context'],
  fallbackMessage: string,
) => {
  const serverError = handleApiFunctionError(error, context)
  const retryAfterSecondsRaw = serverError.details?.['retryAfterSeconds']
  const options: {
    fallbackMessage: string
    headers?: HeadersInit
  } = {
    fallbackMessage,
  }

  if (typeof retryAfterSecondsRaw === 'number') {
    options.headers = { 'Retry-After': String(Math.max(1, Math.ceil(retryAfterSecondsRaw))) }
  }

  return buildApiErrorResponse(serverError, options)
}

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const { context: apiContext, fingerprint } = createApiFunctionContext({
    route: ROUTE,
    operation: 'POST',
    request,
    cookies,
    clientAddress,
  })

  try {
    const rateLimitIdentifier = createRateLimitIdentifier('gdpr:consent:post', fingerprint)
    const { success, reset } = await checkRateLimit(rateLimiters.consent, rateLimitIdentifier)
    if (!success) {
      throw buildRateLimitError(reset)
    }

    let body: ConsentRequest
    try {
      body = await request.json()
    } catch {
      throw new ApiFunctionError({
        message: 'Invalid JSON payload',
        status: 400,
        code: 'INVALID_JSON',
      })
    }

    if (!uuidValidate(body.DataSubjectId)) {
      throw new ApiFunctionError({
        message: 'Invalid DataSubjectId',
        status: 400,
        code: 'INVALID_UUID',
      })
    }

    const normalizedEmail = normalizeNullableString(body.email ?? null)
    const normalizedPurposes = sanitizePurposes(body.purposes)
    const normalizedSource = sanitizeSource(body.source)
    const normalizedUserAgent = normalizeUserAgent(body.userAgent)
    const normalizedIpAddress = normalizeNullableString(body.ipAddress ?? null)
    const normalizedConsentText = normalizeNullableString(body.consentText ?? null)

    let record: ConsentResponse['record']
    try {
      const { data, error } = await supabaseAdmin
        .from('consent_records')
        .insert({
          data_subject_id: body.DataSubjectId,
          email: normalizedEmail,
          purposes: normalizedPurposes,
          source: normalizedSource,
          user_agent: normalizedUserAgent,
          ip_address: normalizedIpAddress,
          privacy_policy_version: getPrivacyPolicyVersion(),
          consent_text: normalizedConsentText,
          verified: body.verified ?? false,
        })
        .select()
        .single()

      if (error) {
        throw new ApiFunctionError(error, {
          route: ROUTE,
          operation: 'insert-consent',
          status: 500,
          details: {
            dataSubjectId: body.DataSubjectId,
            purposes: body.purposes,
          },
        })
      }

      record = mapConsentRecord(data as ConsentRecordRow)
    } catch (error) {
      if (!isSupabaseFallbackEnabled()) {
        throw error
      }
      console.warn('[gdpr/consent] Supabase unavailable, returning mocked consent record for e2e tests.')
      record = buildMockConsentRecord(body)
    }

    return jsonResponse(
      {
        success: true,
        record,
      } satisfies ConsentResponse,
      201,
    )
  } catch (error) {
    return buildErrorResponse(error, apiContext, 'Failed to record consent')
  }
}


export const GET: APIRoute = async ({ clientAddress, url, request, cookies }) => {
  const { context: apiContext, fingerprint } = createApiFunctionContext({
    route: ROUTE,
    operation: 'GET',
    request,
    cookies,
    clientAddress,
  })

  const DataSubjectId = url.searchParams.get('DataSubjectId')
  const purpose = url.searchParams.get('purpose')

  try {
    const rateLimitIdentifier = createRateLimitIdentifier('gdpr:consent:get', fingerprint)
    const { success, reset } = await checkRateLimit(rateLimiters.consentRead, rateLimitIdentifier)
    if (!success) {
      throw buildRateLimitError(reset)
    }

    if (!DataSubjectId || !uuidValidate(DataSubjectId)) {
      throw new ApiFunctionError({
        message: 'Valid DataSubjectId required',
        status: 400,
        code: 'INVALID_UUID',
      })
    }

    let query = supabaseAdmin
      .from('consent_records')
      .select('*')
      .eq('data_subject_id', DataSubjectId)

    if (purpose) {
      query = query.contains('purposes', [purpose])
    }

    const { data, error } = await query

    if (error) {
      throw new ApiFunctionError(error, {
        route: ROUTE,
        operation: 'GET.fetch-consent-records',
        status: 500,
        details: {
          dataSubjectId: DataSubjectId,
          purpose,
        },
      })
    }

    const records = data.map(record => mapConsentRecord(record as ConsentRecordRow))

    return jsonResponse(
      {
        success: true,
        records,
        hasActive: purpose ? records.length > 0 : undefined,
        activeRecord: purpose && records.length > 0 ? records[0] : undefined,
      },
      200,
    )
  } catch (error) {
    apiContext.extra = {
      ...(apiContext.extra || {}),
      dataSubjectId: DataSubjectId,
      purpose,
    }
    return buildErrorResponse(error, apiContext, 'Failed to retrieve consent')
  }
}


export const DELETE: APIRoute = async ({ clientAddress, url, request, cookies }) => {
  const { context: apiContext, fingerprint } = createApiFunctionContext({
    route: ROUTE,
    operation: 'DELETE',
    request,
    cookies,
    clientAddress,
  })

  const DataSubjectId = url.searchParams.get('DataSubjectId')

  try {
    const rateLimitIdentifier = createRateLimitIdentifier('gdpr:consent:delete', fingerprint)
    const { success, reset } = await checkRateLimit(rateLimiters.delete, rateLimitIdentifier)
    if (!success) {
      throw buildRateLimitError(reset)
    }

    if (!DataSubjectId || !uuidValidate(DataSubjectId)) {
      throw new ApiFunctionError({
        message: 'Valid DataSubjectId required',
        status: 400,
        code: 'INVALID_UUID',
      })
    }

    const { data, error } = await supabaseAdmin
      .from('consent_records')
      .delete()
      .eq('data_subject_id', DataSubjectId)
      .select()

    if (error) {
      throw new ApiFunctionError(error, {
        route: ROUTE,
        operation: 'DELETE.remove-consent',
        status: 500,
        details: {
          dataSubjectId: DataSubjectId,
        },
      })
    }

    return jsonResponse(
      {
        success: true,
        deletedCount: data?.length || 0,
      },
      200,
    )
  } catch (error) {
    apiContext.extra = {
      ...(apiContext.extra || {}),
      dataSubjectId: DataSubjectId,
    }
    return buildErrorResponse(error, apiContext, 'Failed to delete consent')
  }
}
