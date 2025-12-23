import type { APIRoute } from 'astro'
import { db, lt, newsletterConfirmations } from 'astro:db'
import { getCronSecret } from '@pages/api/_utils/environment'
import {
  ApiFunctionError,
  buildApiErrorResponse,
  handleApiFunctionError
} from '@pages/api/_utils/errors'
import { createApiFunctionContext } from '@pages/api/_utils/requestContext'

export const prerender = false

const ROUTE = '/api/cron/cleanup-confirmations'

const buildErrorResponse = (
  error: unknown,
  context: ReturnType<typeof createApiFunctionContext>['context'],
  fallbackMessage: string,
) => buildApiErrorResponse(handleApiFunctionError(error, context), { fallbackMessage })

/**
 * Cron job to clean up newsletter confirmations
 * - Removes expired tokens (expires_at < now())
 * - Removes old confirmed records (confirmed_at IS NOT NULL AND created_at < now() - 7 days)
 *
 * Scheduled via vercel.json to run daily
 */
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
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    let expiredCount = 0
    try {
      const expiredData = await db
        .delete(newsletterConfirmations)
        .where(lt(newsletterConfirmations.expiresAt, now))
        .returning({ id: newsletterConfirmations.id })

      expiredCount = expiredData.length
    } catch (error) {
      throw new ApiFunctionError(error, {
        route: ROUTE,
        operation: 'deleteExpiredTokens',
        status: 500,
        code: 'CRON_DELETE_EXPIRED_TOKENS_FAILED',
      })
    }

    let confirmedCount = 0
    try {
      const confirmedData = await db
        .delete(newsletterConfirmations)
        .where(lt(newsletterConfirmations.confirmedAt, sevenDaysAgo))
        .returning({ id: newsletterConfirmations.id })

      confirmedCount = confirmedData.length
    } catch (error) {
      throw new ApiFunctionError(error, {
        route: ROUTE,
        operation: 'deleteConfirmedRecords',
        status: 500,
        code: 'CRON_DELETE_CONFIRMED_TOKENS_FAILED',
      })
    }

    const totalDeleted = expiredCount + confirmedCount

    console.log(
      `Newsletter confirmations cleanup: deleted ${expiredCount} expired + ${confirmedCount} old confirmed = ${totalDeleted} total`,
    )

    return new Response(
      JSON.stringify({
        success: true,
        deleted: {
          expired: expiredCount,
          oldConfirmed: confirmedCount,
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
    return buildErrorResponse(error, apiContext, 'Failed to clean up newsletter confirmations')
  }
}
