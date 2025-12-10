/**
 * Cron API Route to ping third-party integrations to keep them awake.
 * Currently pings Astro DB (newsletter confirmations table).
 */
import type { APIRoute } from 'astro'
import { db, newsletterConfirmations } from 'astro:db'
import {
  getCronSecret,
} from '@pages/api/_environment/environmentApi'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
import { createApiFunctionContext } from '@pages/api/_utils/requestContext'

export const prerender = false

const ROUTE = '/api/cron/ping-integrations'

const buildErrorResponse = (
  error: unknown,
  context: ReturnType<typeof createApiFunctionContext>['context'],
  fallbackMessage: string,
) => buildApiErrorResponse(handleApiFunctionError(error, context), { fallbackMessage })

const pingAstroDb = async () => {
  const start = Date.now()
  try {
    const data = await db
      .select({ id: newsletterConfirmations.id })
      .from(newsletterConfirmations)
      .limit(1)

    return {
      rowsChecked: data.length,
      durationMs: Date.now() - start,
    }
  } catch (error) {
    throw new ApiFunctionError(error, {
      message: 'Astro DB ping failed',
      status: 500,
      code: 'CRON_ASTRO_DB_PING_FAILED',
      route: ROUTE,
      operation: 'pingAstroDb',
    })
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
    const astroDbResult = await pingAstroDb()

    return new Response(
      JSON.stringify({
        success: true,
        astroDb: astroDbResult,
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
