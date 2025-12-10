import type { APIRoute } from 'astro'
import { and, db, dsarRequests, isNull, lt } from 'astro:db'
import { getCronSecret } from '@pages/api/_environment/environmentApi'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
import { createApiFunctionContext } from '@pages/api/_utils/requestContext'

export const prerender = false

const ROUTE = '/api/cron/cleanup-dsar-requests'

const buildErrorResponse = (
  error: unknown,
  context: ReturnType<typeof createApiFunctionContext>['context'],
  fallbackMessage: string,
) => buildApiErrorResponse(handleApiFunctionError(error, context), { fallbackMessage })

export const GET: APIRoute = async ({ request, clientAddress, cookies }) => {
  const { context: apiContext } = createApiFunctionContext({
    route: ROUTE,
    operation: 'GET',
    request,
    clientAddress,
    cookies,
  })

  // Verify cron secret for security
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
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    let fulfilledCount = 0
    try {
      const fulfilledData = await db
        .delete(dsarRequests)
        .where(lt(dsarRequests.fulfilledAt, thirtyDaysAgo))
        .returning({ id: dsarRequests.id })

      fulfilledCount = fulfilledData.length
    } catch (error) {
      throw new ApiFunctionError(error, {
        route: ROUTE,
        operation: 'deleteFulfilledRequests',
        status: 500,
        code: 'CRON_DELETE_FULFILLED_DSAR_FAILED',
      })
    }

    let expiredCount = 0
    try {
      const expiredData = await db
        .delete(dsarRequests)
        .where(
          and(
            isNull(dsarRequests.fulfilledAt),
            lt(dsarRequests.createdAt, sevenDaysAgo),
          ),
        )
        .returning({ id: dsarRequests.id })

      expiredCount = expiredData.length
    } catch (error) {
      throw new ApiFunctionError(error, {
        route: ROUTE,
        operation: 'deleteExpiredRequests',
        status: 500,
        code: 'CRON_DELETE_EXPIRED_DSAR_FAILED',
      })
    }

    const totalDeleted = fulfilledCount + expiredCount

    console.log(
      `DSAR requests cleanup: deleted ${fulfilledCount} old fulfilled + ${expiredCount} expired unfulfilled = ${totalDeleted} total`,
    )

    return new Response(
      JSON.stringify({
        success: true,
        deleted: {
          fulfilled: fulfilledCount,
          expired: expiredCount,
          total: totalDeleted,
        },
        timestamp: now.toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    apiContext.extra = {
      ...(apiContext.extra || {}),
      authHeader: 'REDACTED',
    }
    return buildErrorResponse(error, apiContext, 'Failed to clean up DSAR requests')
  }
}
