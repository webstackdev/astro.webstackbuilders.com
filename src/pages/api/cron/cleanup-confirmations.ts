import type { APIRoute } from 'astro'
import { getCronSecret } from '@pages/api/_environment/environmentApi'
import { supabaseAdmin } from '@pages/api/_utils'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
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

    // Delete expired tokens
    const { data: expiredData, error: expiredError } = await supabaseAdmin
      .from('newsletter_confirmations')
      .delete()
      .lt('expires_at', now.toISOString())
      .select()

    if (expiredError) {
      throw new ApiFunctionError({
        message: `Failed to delete expired tokens: ${expiredError.message}`,
        cause: expiredError,
        code: 'CRON_DELETE_EXPIRED_TOKENS_FAILED',
        status: 500,
        route: ROUTE,
        operation: 'deleteExpiredTokens',
      })
    }

    // Delete old confirmed records (7+ days old)
    const { data: confirmedData, error: confirmedError } = await supabaseAdmin
      .from('newsletter_confirmations')
      .delete()
      .not('confirmed_at', 'is', null)
      .lt('created_at', sevenDaysAgo.toISOString())
      .select()

    if (confirmedError) {
      throw new ApiFunctionError({
        message: `Failed to delete old confirmed records: ${confirmedError.message}`,
        cause: confirmedError,
        code: 'CRON_DELETE_CONFIRMED_TOKENS_FAILED',
        status: 500,
        route: ROUTE,
        operation: 'deleteConfirmedRecords',
      })
    }

    const expiredCount = expiredData?.length || 0
    const confirmedCount = confirmedData?.length || 0
    const totalDeleted = expiredCount + confirmedCount

    console.log(
      `Newsletter confirmations cleanup: deleted ${expiredCount} expired + ${confirmedCount} old confirmed = ${totalDeleted} total`
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
