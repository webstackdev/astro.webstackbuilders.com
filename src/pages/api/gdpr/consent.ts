import type { APIRoute } from 'astro'
import { getPrivacyPolicyVersion } from '@pages/api/_environment'
import { rateLimiters, checkRateLimit, supabaseAdmin } from '@pages/api/_utils'
import { validate as uuidValidate } from 'uuid'
import type { ConsentRequest, ConsentResponse, ErrorResponse } from '@pages/api/_contracts/gdpr.contracts'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'

export const prerender = false // Force SSR for this endpoint

const ROUTE = '/api/gdpr/consent'

const jsonResponse = (body: unknown, status: number, headers?: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  })

const buildRateLimitResponse = (reset: number | undefined, message?: string) => {
  const retryAfterSeconds = reset ? Math.max(0, Math.ceil((reset - Date.now()) / 1000)) : 60
  return jsonResponse(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: message ?? `Try again in ${retryAfterSeconds}s`,
      },
    } satisfies ErrorResponse,
    429,
    {
      'Retry-After': String(retryAfterSeconds),
    },
  )
}

const buildServerErrorResponse = (serverError: ApiFunctionError, defaultMessage: string) =>
  jsonResponse(
    {
      success: false,
      error: {
        code: resolveErrorCode(serverError.code),
        message: serverError.status >= 400 && serverError.status < 500 ? serverError.message : defaultMessage,
      },
    } satisfies ErrorResponse,
    serverError.status ?? 500,
  )

const resolveErrorCode = (code?: string): ErrorResponse['error']['code'] => {
  const allowedCodes: Array<ErrorResponse['error']['code']> = [
    'INVALID_UUID',
    'RATE_LIMIT_EXCEEDED',
    'NOT_FOUND',
    'UNAUTHORIZED',
    'INVALID_REQUEST',
    'INTERNAL_ERROR',
  ]

  if (code && allowedCodes.includes(code as ErrorResponse['error']['code'])) {
    return code as ErrorResponse['error']['code']
  }

  return 'INTERNAL_ERROR'
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Rate limiting
  const { success, reset } = await checkRateLimit(rateLimiters.consent, clientAddress)

  if (!success) {
    return buildRateLimitResponse(reset)
  }

  try {
    const body: ConsentRequest = await request.json()

    // Validate DataSubjectId
    if (!uuidValidate(body.DataSubjectId)) {
      return jsonResponse({
        success: false,
        error: { code: 'INVALID_UUID', message: 'Invalid DataSubjectId' },
      } satisfies ErrorResponse, 400)
    }

    // Insert consent record (database uses snake_case column names)
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
        verified: body.verified ?? false
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

    return jsonResponse(
      {
        success: true,
        record: {
          id: data.id,
          DataSubjectId: data.data_subject_id,
          email: data.email,
          purposes: data.purposes,
          timestamp: data.timestamp,
          source: data.source,
          userAgent: data.user_agent,
          ipAddress: data.ip_address,
          privacyPolicyVersion: data.privacy_policy_version,
          consentText: data.consent_text,
          verified: data.verified,
        },
      } satisfies ConsentResponse,
      201,
    )
  } catch (error) {
    const serverError = handleApiFunctionError(error, {
      route: ROUTE,
      operation: 'POST',
      extra: {
        clientAddress,
      },
    })

    return buildServerErrorResponse(serverError, 'Failed to record consent')
  }
}

export const GET: APIRoute = async ({ clientAddress, url }) => {
  // Rate limiting
  const { success, reset } = await checkRateLimit(rateLimiters.consentRead, clientAddress)

  if (!success) {
    return buildRateLimitResponse(reset)
  }

  const DataSubjectId = url.searchParams.get('DataSubjectId')
  const purpose = url.searchParams.get('purpose')

  if (!DataSubjectId || !uuidValidate(DataSubjectId)) {
    return jsonResponse({
      success: false,
      error: { code: 'INVALID_UUID', message: 'Valid DataSubjectId required' },
    } satisfies ErrorResponse, 400)
  }

  try {
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
    const serverError = handleApiFunctionError(error, {
      route: ROUTE,
      operation: 'GET',
      extra: {
        clientAddress,
        dataSubjectId: DataSubjectId,
        purpose,
      },
    })

    return buildServerErrorResponse(serverError, 'Failed to retrieve consent')
  }
}

export const DELETE: APIRoute = async ({ clientAddress, url }) => {
  // Rate limiting
  const { success, reset } = await checkRateLimit(rateLimiters.delete, clientAddress)

  if (!success) {
    return buildRateLimitResponse(reset)
  }

  const DataSubjectId = url.searchParams.get('DataSubjectId')

  if (!DataSubjectId || !uuidValidate(DataSubjectId)) {
    return jsonResponse({
      success: false,
      error: { code: 'INVALID_UUID', message: 'Valid DataSubjectId required' },
    } satisfies ErrorResponse, 400)
  }

  try {
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
    const serverError = handleApiFunctionError(error, {
      route: ROUTE,
      operation: 'DELETE',
      extra: {
        clientAddress,
        dataSubjectId: DataSubjectId,
      },
    })

    return buildServerErrorResponse(serverError, 'Failed to delete consent')
  }
}
