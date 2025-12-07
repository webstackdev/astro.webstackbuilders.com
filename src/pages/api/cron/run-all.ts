import type { APIRoute } from 'astro'
import { getCronSecret } from '@pages/api/_environment/environmentApi'
import { getSiteUrl } from '@pages/api/_environment/siteUrlApi'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
import { createApiFunctionContext } from '@pages/api/_utils/requestContext'

export const prerender = false

const ROUTE = '/api/cron/run-all'
const CRON_ENDPOINTS = [
  '/api/cron/cleanup-confirmations',
  '/api/cron/cleanup-dsar-requests',
  '/api/cron/ping-integrations',
]

const buildErrorResponse = (
  error: unknown,
  context: ReturnType<typeof createApiFunctionContext>['context'],
  fallbackMessage: string,
) => buildApiErrorResponse(handleApiFunctionError(error, context), { fallbackMessage })

async function triggerCronEndpoint(path: string) {
  const url = new URL(path, getSiteUrl())
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getCronSecret()}`,
    },
  })

  const elapsedMs = response.headers.get('x-vercel-elapsed-time')
  const duration = typeof elapsedMs === 'string' ? Number(elapsedMs) : undefined

  let body: unknown

  try {
    body = await response.json()
  } catch {
    body = await response.text()
  }

  if (!response.ok) {
    throw new ApiFunctionError(
      `Cron runner failed for ${path}: ${response.status} ${response.statusText}`,
      {
        status: response.status,
        code: 'CRON_RUNNER_TARGET_FAILED',
        route: ROUTE,
        operation: path,
        details: {
          body,
        },
      },
    )
  }

  return {
    path,
    status: response.status,
    durationMs: typeof duration === 'number' && Number.isFinite(duration) ? duration : undefined,
    body,
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
    console.warn('Unauthorized cron runner attempt - invalid CRON_SECRET')
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
    const results = await Promise.all(CRON_ENDPOINTS.map(triggerCronEndpoint))

    return new Response(
      JSON.stringify({
        success: true,
        results,
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
    return buildErrorResponse(error, apiContext, 'Cron runner failed to execute downstream jobs')
  }
}
