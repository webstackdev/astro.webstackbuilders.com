import type { APIRoute } from 'astro'
import { getCronSecret } from '@pages/api/_environment'
import { supabaseAdmin } from '@pages/api/_utils'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'

export const prerender = false

/**
 * Cron job to clean up DSAR requests
 * - Removes fulfilled requests older than 30 days
 * - Removes expired unfulfilled requests (created > 7 days ago AND fulfilled_at IS NULL)
 *
 * Scheduled via vercel.json to run daily
 */
export const GET: APIRoute = async ({ request }) => {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${getCronSecret()}`) {
    console.warn('Unauthorized cron attempt - invalid CRON_SECRET')
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Delete old fulfilled requests (30+ days)
    const { data: fulfilledData, error: fulfilledError } = await supabaseAdmin
      .from('dsar_requests')
      .delete()
      .not('fulfilled_at', 'is', null)
      .lt('fulfilled_at', thirtyDaysAgo.toISOString())
      .select()

  if (fulfilledError) {
    throw new ApiFunctionError({
      message: `Failed to delete fulfilled requests: ${fulfilledError.message}`,
      cause: fulfilledError,
      code: 'CRON_DELETE_FULFILLED_DSAR_FAILED',
      status: 500,
      route: '/api/cron/cleanup-dsar-requests',
      operation: 'deleteFulfilledRequests'
    })
    }

    // Delete expired unfulfilled requests (7+ days old, never fulfilled)
    const { data: expiredData, error: expiredError } = await supabaseAdmin
      .from('dsar_requests')
      .delete()
      .is('fulfilled_at', null)
      .lt('created_at', sevenDaysAgo.toISOString())
      .select()

  if (expiredError) {
    throw new ApiFunctionError({
      message: `Failed to delete expired requests: ${expiredError.message}`,
      cause: expiredError,
      code: 'CRON_DELETE_EXPIRED_DSAR_FAILED',
      status: 500,
      route: '/api/cron/cleanup-dsar-requests',
      operation: 'deleteExpiredRequests'
    })
    }

    const fulfilledCount = fulfilledData?.length || 0
    const expiredCount = expiredData?.length || 0
    const totalDeleted = fulfilledCount + expiredCount

    console.log(
      `DSAR requests cleanup: deleted ${fulfilledCount} old fulfilled + ${expiredCount} expired unfulfilled = ${totalDeleted} total`
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
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const serverError = handleApiFunctionError(error, {
      route: '/api/cron/cleanup-dsar-requests',
      operation: 'GET',
    })
    return new Response(
      JSON.stringify({
        success: false,
        error: serverError.message,
      }),
      { status: serverError.status ?? 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
