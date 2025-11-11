import type { APIRoute } from 'astro'
import { supabaseAdmin } from '@components/scripts/consent/db/supabase'

/**
 * Cron job to clean up newsletter confirmations
 * - Removes expired tokens (expires_at < now())
 * - Removes old confirmed records (confirmed_at IS NOT NULL AND created_at < now() - 7 days)
 *
 * Scheduled via vercel.json to run daily
 */
export const GET: APIRoute = async ({ request }) => {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = import.meta.env['CRON_SECRET']

  if (!cronSecret) {
    console.error('CRON_SECRET not configured')
    return new Response(
      JSON.stringify({ success: false, error: 'CRON_SECRET not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('Unauthorized cron attempt - invalid CRON_SECRET')
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
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
      throw new Error(`Failed to delete expired tokens: ${expiredError.message}`)
    }

    // Delete old confirmed records (7+ days old)
    const { data: confirmedData, error: confirmedError } = await supabaseAdmin
      .from('newsletter_confirmations')
      .delete()
      .not('confirmed_at', 'is', null)
      .lt('created_at', sevenDaysAgo.toISOString())
      .select()

    if (confirmedError) {
      throw new Error(`Failed to delete old confirmed records: ${confirmedError.message}`)
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
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Newsletter confirmations cleanup failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
