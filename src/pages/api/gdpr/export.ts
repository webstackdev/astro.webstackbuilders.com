import type { APIRoute } from 'astro'
import { rateLimiters, checkRateLimit, supabaseAdmin } from '@pages/api/_utils'
import { validate as uuidValidate } from 'uuid'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
import { createApiFunctionContext, createRateLimitIdentifier } from '@pages/api/_utils/requestContext'

export const prerender = false // Force SSR for this endpoint

const ROUTE = '/api/gdpr/export'

const buildRateLimitError = (reset: number | undefined) => {
  const retryAfterMs = typeof reset === 'number' ? Math.max(0, reset - Date.now()) : 0
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
  return new ApiFunctionError({
    message: `Try again in ${retryAfterSeconds}s`,
    status: 429,
    code: 'RATE_LIMIT_EXCEEDED',
    details: { retryAfterSeconds },
  })
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


export const GET: APIRoute = async ({ clientAddress, url, request, cookies }) => {
	const { context: apiContext, fingerprint } = createApiFunctionContext({
		route: ROUTE,
		operation: 'GET',
		request,
		cookies,
		clientAddress,
	})

	const DataSubjectId = url.searchParams.get('DataSubjectId')

	try {
		const rateLimitIdentifier = createRateLimitIdentifier('gdpr:export:get', fingerprint)
		const { success, reset } = await checkRateLimit(rateLimiters.export, rateLimitIdentifier)
		if (!success) {
			throw buildRateLimitError(reset)
		}

		if (!DataSubjectId || !uuidValidate(DataSubjectId)) {
			throw new ApiFunctionError({
				message: 'Invalid DataSubjectId',
				status: 400,
				code: 'INVALID_UUID',
			})
		}

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
    apiContext.extra = {
      ...(apiContext.extra || {}),
      dataSubjectId: DataSubjectId,
    }
    return buildErrorResponse(error, apiContext, 'Failed to export data')
  }
}
