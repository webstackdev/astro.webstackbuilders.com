import type { APIRoute } from 'astro'
import { rateLimiters, checkRateLimit, supabaseAdmin } from '@pages/api/_utils'
import { validate as uuidValidate } from 'uuid'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
import type { ErrorResponse } from '@pages/api/_contracts/gdpr.contracts'

export const prerender = false // Force SSR for this endpoint

const ROUTE = '/api/gdpr/export'

const jsonResponse = (body: unknown, status: number, headers?: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  })

const buildRateLimitResponse = (reset: number | undefined) => {
  const retryAfterSeconds = reset ? Math.max(0, Math.ceil((reset - Date.now()) / 1000)) : 60
  return jsonResponse(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Try again in ${retryAfterSeconds}s`,
      },
    } satisfies ErrorResponse,
    429,
    {
      'Retry-After': String(retryAfterSeconds),
    },
  )
}

export const GET: APIRoute = async ({ clientAddress, url }) => {
  const { success, reset } = await checkRateLimit(rateLimiters.export, clientAddress)

  if (!success) {
    return buildRateLimitResponse(reset)
  }

  const DataSubjectId = url.searchParams.get('DataSubjectId')

  if (!DataSubjectId || !uuidValidate(DataSubjectId)) {
    return new Response('Invalid DataSubjectId', { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('consent_records')
      .select('*')
      .eq('data_subject_id', DataSubjectId)

    if (error) {
      throw new ApiFunctionError(error, {
        route: ROUTE,
        operation: 'GET.fetch-consent-records',
        status: 500,
        details: {
          dataSubjectId: DataSubjectId,
        },
      })
    }

    // Remove sensitive fields (ip_address)
    const exportData = data.map(({ ip_address: _ip, ...record }) => record)

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="my-data-${Date.now()}.json"`
      }
    })
  } catch (error) {
    const serverError = handleApiFunctionError(error, {
      route: ROUTE,
      operation: 'GET',
      extra: {
        clientAddress,
        dataSubjectId: DataSubjectId,
      },
    })

    return new Response('Failed to export data', {
      status: serverError.status ?? 500,
    })
  }
}
