/**
 * Cron API Route to ping third-party integrations to keep them awake.
 * Currently pings:
 * - Upstash (key-value store)
 * - Supabase (database)
 */
import type { APIRoute } from 'astro'
import {
  getCronSecret,
  getUpstashApiToken,
  getUpstashApiUrl,
} from '@pages/api/_environment/environmentApi'
import { supabaseAdmin } from '@pages/api/_utils'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
import { createApiFunctionContext } from '@pages/api/_utils/requestContext'

export const prerender = false

const ROUTE = '/api/cron/ping-integrations'
const UPSTASH_KEY = '__cron_keepalive__'

const buildErrorResponse = (
  error: unknown,
  context: ReturnType<typeof createApiFunctionContext>['context'],
  fallbackMessage: string,
) => buildApiErrorResponse(handleApiFunctionError(error, context), { fallbackMessage })

const pingUpstash = async () => {
  const start = Date.now()
  const endpoint = new URL(`/get/${encodeURIComponent(UPSTASH_KEY)}`, getUpstashApiUrl())
  const response = await fetch(endpoint.toString(), {
    headers: {
      Authorization: `Bearer ${getUpstashApiToken()}`,
    },
  })

  if (!response.ok) {
    throw new ApiFunctionError({
      message: `Upstash ping failed with status ${response.status}`,
      status: response.status,
      code: 'CRON_UPSTASH_PING_FAILED',
      route: ROUTE,
      operation: 'pingUpstash',
    })
  }

  let payload: unknown

  try {
    payload = await response.json()
  } catch {
    payload = await response.text()
  }

  return {
    payload,
    durationMs: Date.now() - start,
  }
}

const pingSupabase = async () => {
  const start = Date.now()
  const { data, error, count } = await supabaseAdmin
    .from('newsletter_confirmations')
    .select('id', { count: 'exact' })
    .limit(1)

  if (error) {
    throw new ApiFunctionError({
      message: `Supabase ping failed: ${error.message ?? 'Unknown error'}`,
      cause: error,
      status: 500,
      code: 'CRON_SUPABASE_PING_FAILED',
      route: ROUTE,
      operation: 'pingSupabase',
    })
  }

  return {
    rowsChecked: typeof count === 'number' ? count : data?.length ?? 0,
    durationMs: Date.now() - start,
  }
}

export const GET: APIRoute = async ({ request, clientAddress, cookies }) => {
  const { context: apiContext } = createApiFunctionContext({
    route: ROUTE,
    operation: 'GET',
    request,
    clientAddress,
    cookies,
  })

  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${getCronSecret()}`) {
    console.warn('Unauthorized cron attempt - invalid CRON_SECRET')
    apiContext.extra = {
      ...(apiContext.extra || {}),
      authHeader: authHeader ? 'PRESENT' : 'MISSING',
      clientAddress,
    }

    return buildErrorResponse(
      new ApiFunctionError({
        message: 'Unauthorized',
        status: 401,
        code: 'UNAUTHORIZED',
      }),
      apiContext,
      'Unauthorized cron access',
    )
  }

  try {
    const [upstashResult, supabaseResult] = await Promise.all([
      pingUpstash(),
      pingSupabase(),
    ])

    return new Response(
      JSON.stringify({
        success: true,
        upstash: upstashResult,
        supabase: supabaseResult,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    apiContext.extra = {
      ...(apiContext.extra || {}),
      authHeader: 'REDACTED',
    }
    return buildErrorResponse(error, apiContext, 'Failed to ping backing services')
  }
}
