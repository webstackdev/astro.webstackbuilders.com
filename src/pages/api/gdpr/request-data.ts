import type { APIRoute } from 'astro'
import { supabaseAdmin } from '@components/scripts/consent/db/supabase'
import { rateLimiters, checkRateLimit } from '@pages/api/_utils/rateLimit'
import { sendDSARVerificationEmail } from '@pages/api/gdpr/_dsarVerificationEmails'
import type { DSARRequestInput, DSARResponse, ErrorResponse } from '@pages/api/_contracts/gdpr.contracts'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/gdpr/request-data
 * Initiates a DSAR (Data Subject Access Request) for data access or deletion
 * Sends verification email with token
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Rate limiting (use export limiter - 5 requests per minute)
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

  try {
    const body: DSARRequestInput = await request.json()

    // Validate request
    if (!body.email || !body.requestType) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Email and request type are required'
        }
      } as ErrorResponse), { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid email format'
        }
      } as ErrorResponse), { status: 400 })
    }

    // Validate request type
    if (!['ACCESS', 'DELETE'].includes(body.requestType)) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Request type must be ACCESS or DELETE'
        }
      } as ErrorResponse), { status: 400 })
    }

    const email = body.email.toLowerCase().trim()
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Check for existing unfulfilled request for this email
    const { data: existing } = await supabaseAdmin
      .from('dsar_requests')
      .select('*')
      .eq('email', email)
      .eq('request_type', body.requestType)
      .is('fulfilled_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existing) {
      // Resend verification email with existing token
      await sendDSARVerificationEmail(email, existing.token, body.requestType)

      return new Response(JSON.stringify({
        success: true,
        message: 'Verification email sent. Please check your inbox.'
      } as DSARResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create new DSAR request (database uses snake_case columns)
    const { error } = await supabaseAdmin
      .from('dsar_requests')
      .insert({
        token,
        email,
        request_type: body.requestType,
        expires_at: expiresAt.toISOString()
      })

    if (error) {
      throw error
    }

    // Send verification email
    await sendDSARVerificationEmail(email, token, body.requestType)

    return new Response(JSON.stringify({
      success: true,
      message: 'Verification email sent. Please check your inbox and click the link to complete your request.'
    } as DSARResponse), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Failed to create DSAR request:', error)
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Failed to process request. Please try again.'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
