import type { APIRoute } from 'astro'
import { supabaseAdmin } from '@components/scripts/consent/db/supabase'
import { rateLimiters, checkRateLimit } from '@pages/api/_utils/rateLimit'
import { isValidUUID } from '@lib/helpers/uuid'
import type { ConsentRequest, ConsentResponse, ErrorResponse } from '@api/@types/gdpr'

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Rate limiting
  const { success, reset } = await checkRateLimit(rateLimiters.consent, clientAddress)

  if (!success) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Try again in ${Math.ceil((reset! - Date.now()) / 1000)}s`
      }
    } as ErrorResponse), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((reset! - Date.now()) / 1000))
      }
    })
  }

  try {
    const body: ConsentRequest = await request.json()

    // Validate DataSubjectId
    if (!isValidUUID(body.DataSubjectId)) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: 'INVALID_UUID', message: 'Invalid DataSubjectId' }
      } as ErrorResponse), { status: 400 })
    }

    // Insert consent record (database uses snake_case column names)
    // eslint-disable-next-line camelcase
    const { data, error } = await supabaseAdmin
      .from('consent_records')
      .insert({
        data_subject_id: body.DataSubjectId,
        email: body.email?.toLowerCase().trim(),
        purposes: body.purposes,
        source: body.source,
        user_agent: body.userAgent,
        ip_address: body.ipAddress,
        privacy_policy_version: import.meta.env['PUBLIC_PRIVACY_POLICY_VERSION'] as string,
        consent_text: body.consentText,
        verified: body.verified ?? false
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({
      success: true,
      record: {
        id: data.id,
        DataSubjectId: data.data_subject_id,
        email: data.email,
        purposes: data.purposes,
        timestamp: data.timestamp,
        source: data.source,
        userAgent: data.user_agent,
        ipAddress: data.ip_address,
        privacyPolicyVersion: data.privacy_policy_version,
        consentText: data.consent_text,
        verified: data.verified
      }
    } as ConsentResponse), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to record consent:', error)
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to record consent' }
    }), { status: 500 })
  }
}

export const GET: APIRoute = async ({ clientAddress, url }) => {
  // Rate limiting
  const { success, reset } = await checkRateLimit(rateLimiters.consentRead, clientAddress)

  if (!success) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Try again in ${Math.ceil((reset! - Date.now()) / 1000)}s`
      }
    } as ErrorResponse), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((reset! - Date.now()) / 1000))
      }
    })
  }

  const DataSubjectId = url.searchParams.get('DataSubjectId')
  const purpose = url.searchParams.get('purpose')

  if (!DataSubjectId || !isValidUUID(DataSubjectId)) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INVALID_UUID', message: 'Valid DataSubjectId required' }
    } as ErrorResponse), { status: 400 })
  }

  try {
    let query = supabaseAdmin
      .from('consent_records')
      .select('*')
      .eq('data_subject_id', DataSubjectId)

    if (purpose) {
      query = query.contains('purposes', [purpose])
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const records = data.map(record => ({
      id: record.id,
      DataSubjectId: record.data_subject_id,
      email: record.email,
      purposes: record.purposes,
      timestamp: record.timestamp,
      source: record.source,
      userAgent: record.user_agent,
      ipAddress: record.ip_address,
      privacyPolicyVersion: record.privacy_policy_version,
      consentText: record.consent_text,
      verified: record.verified
    }))

    return new Response(JSON.stringify({
      success: true,
      records,
      hasActive: purpose ? records.length > 0 : undefined,
      activeRecord: purpose && records.length > 0 ? records[0] : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to retrieve consent:', error)
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve consent' }
    }), { status: 500 })
  }
}

export const DELETE: APIRoute = async ({ clientAddress, url }) => {
  // Rate limiting
  const { success, reset } = await checkRateLimit(rateLimiters.delete, clientAddress)

  if (!success) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Try again in ${Math.ceil((reset! - Date.now()) / 1000)}s`
      }
    } as ErrorResponse), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((reset! - Date.now()) / 1000))
      }
    })
  }

  const DataSubjectId = url.searchParams.get('DataSubjectId')

  if (!DataSubjectId || !isValidUUID(DataSubjectId)) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INVALID_UUID', message: 'Valid DataSubjectId required' }
    } as ErrorResponse), { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('consent_records')
      .delete()
      .eq('data_subject_id', DataSubjectId)
      .select()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({
      success: true,
      deletedCount: data?.length || 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to delete consent:', error)
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete consent' }
    }), { status: 500 })
  }
}
