import type { APIRoute } from 'astro'
import { supabaseAdmin } from '@components/scripts/consent/db/supabase'
import { rateLimiters, checkRateLimit } from '@pages/api/_utils/rateLimit'
import { validate as uuidValidate } from 'uuid'

export const prerender = false // Force SSR for this endpoint

export const GET: APIRoute = async ({ clientAddress, url }) => {
  const { success, reset } = await checkRateLimit(rateLimiters.export, clientAddress)

  if (!success) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Try again in ${Math.ceil((reset! - Date.now()) / 1000)}s`
      }
    }), {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((reset! - Date.now()) / 1000)) }
    })
  }

  const DataSubjectId = url.searchParams.get('DataSubjectId')

  if (!DataSubjectId || !uuidValidate(DataSubjectId)) {
    return new Response('Invalid DataSubjectId', { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('consent_records')
      .select('*')
      .eq('data_subject_id', DataSubjectId)

    if (error) {
      throw error
    }

    // Remove sensitive fields (ip_address)
    const exportData = data.map(({ ip_address: _ip, ...record }) => record)

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="my-data-${Date.now()}.json"`
      }
    })
  } catch (error) {
    console.error('Failed to export data:', error)
    return new Response('Failed to export data', { status: 500 })
  }
}
