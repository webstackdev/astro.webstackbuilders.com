import type { APIRoute } from 'astro'
import { supabaseAdmin } from '@components/scripts/consent/db/supabase'
import { rateLimiters, checkRateLimit } from '@pages/api/_utils/rateLimit'
import type { ErrorResponse } from '@api/@types/gdpr'

/**
 * GET /api/gdpr/verify?token=xxx
 * Verifies DSAR token and fulfills the request (data access or deletion)
 */
export const GET: APIRoute = async ({ url, clientAddress, redirect }) => {
  // Rate limiting
  const { success, reset } = await checkRateLimit(rateLimiters.export, clientAddress)

  if (!success) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Try again in ${Math.ceil((reset! - Date.now()) / 1000)}s`
      }
    } as ErrorResponse), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((reset! - Date.now()) / 1000))
      }
    })
  }

  const token = url.searchParams.get('token')

  if (!token) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Verification token is required'
        }
    } as ErrorResponse), { status: 400 })
  }

  try {
    // Find the DSAR request
    const { data: dsarRequest, error: fetchError } = await supabaseAdmin
      .from('dsar_requests')
      .select('*')
      .eq('token', token)
      .single()

    if (fetchError || !dsarRequest) {
      return redirect('/privacy/my-data?status=invalid')
    }

    // Check if already fulfilled
    if (dsarRequest.fulfilled_at) {
      return redirect('/privacy/my-data?status=already-completed')
    }

    // Check if expired
    if (new Date(dsarRequest.expires_at) < new Date()) {
      return redirect('/privacy/my-data?status=expired')
    }

    const email = dsarRequest.email
    const requestType = dsarRequest.request_type

    if (requestType === 'ACCESS') {
      // Export all consent data for this email
      const { data: consentRecords } = await supabaseAdmin
        .from('consent_records')
        .select('*')
        .eq('email', email)

      // Mark request as fulfilled
      await supabaseAdmin
        .from('dsar_requests')
        .update({ fulfilled_at: new Date().toISOString() })
        .eq('token', token)

      // Return data as JSON download
      const exportData = {
        email,
        requestDate: dsarRequest.created_at,
        consentRecords: consentRecords?.map(({ ip_address: _ip, ...record }) => record) || []
      }

      return new Response(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="my-data-${Date.now()}.json"`
        }
      })
    } else if (requestType === 'DELETE') {
      // Delete all consent records for this email
      await supabaseAdmin
        .from('consent_records')
        .delete()
        .eq('email', email)

      // Delete newsletter confirmations
      await supabaseAdmin
        .from('newsletter_confirmations')
        .delete()
        .eq('email', email)

      // Mark request as fulfilled
      await supabaseAdmin
        .from('dsar_requests')
        .update({ fulfilled_at: new Date().toISOString() })
        .eq('token', token)

      // Redirect to success page
      return redirect('/privacy/my-data?status=deleted')
    }

    return redirect('/privacy/my-data?status=error')
  } catch (error) {
    console.error('Failed to verify DSAR request:', error)
    return redirect('/privacy/my-data?status=error')
  }
}
