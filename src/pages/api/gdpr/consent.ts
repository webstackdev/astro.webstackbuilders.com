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

const mapConsentRecord = (record: ConsentRecordRow): ConsentResponse['record'] => ({
  id: record.id,
  DataSubjectId: record.data_subject_id,
  email: record.email,
  purposes: record.purposes,
  timestamp: record.timestamp,
  source: record.source,
  userAgent: record.user_agent,
  ipAddress: record.ip_address,
  privacyPolicyVersion: record.privacy_policy_version,
  consentText: record.consent_text,
  verified: record.verified,
})

const buildMockConsentRecord = (body: ConsentRequest): ConsentResponse['record'] => ({
  id: randomUUID(),
  DataSubjectId: body.DataSubjectId,
  email: body.email?.toLowerCase().trim() ?? null,
  purposes: body.purposes,
  timestamp: new Date().toISOString(),
  source: body.source ?? null,
  userAgent: body.userAgent ?? null,
  ipAddress: body.ipAddress ?? null,
  privacyPolicyVersion: getPrivacyPolicyVersion(),
  consentText: body.consentText ?? null,
  verified: body.verified ?? false,
})

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

    let record: ConsentResponse['record']
    try {
      const { data, error } = await supabaseAdmin
        .from('consent_records')
        .insert({
          data_subject_id: body.DataSubjectId,
          email: body.email?.toLowerCase().trim(),
          purposes: body.purposes,
          source: body.source,
          user_agent: body.userAgent,
          ip_address: body.ipAddress,
          privacy_policy_version: getPrivacyPolicyVersion(),
          consent_text: body.consentText,
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

    const records = data.map(record => ({
      id: record.id,
      DataSubjectId: record.data_subject_id,
      email: record.email,
      purposes: record.purposes,
      timestamp: record.timestamp,
      source: record.source,
      userAgent: record.user_agent,
      ipAddress: record.ip_address,
      privacyPolicyVersion: record.privacy_policy_version,
      consentText: record.consent_text,
      verified: record.verified
    }))

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
