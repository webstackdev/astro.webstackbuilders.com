import type { APIRoute } from 'astro'
import { CRON_SECRET } from 'astro:env/server'
import { supabaseAdmin } from '@pages/api/_utils'
import { ClientScriptError } from '@components/scripts/errors'

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
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
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
      throw new ClientScriptError({
        message: `Failed to delete fulfilled requests: ${fulfilledError.message}`
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
      throw new ClientScriptError({
        message: `Failed to delete expired requests: ${expiredError.message}`
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
    console.error('DSAR requests cleanup failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
