import type { APIRoute } from 'astro'
import { v4 as uuidv4 } from 'uuid'
import { rateLimiters, checkRateLimit, supabaseAdmin } from '@pages/api/_utils'
import { sendDSARVerificationEmail } from '@pages/api/gdpr/_dsarVerificationEmails'
import type { DSARRequestInput, DSARResponse, ErrorResponse } from '@pages/api/_contracts/gdpr.contracts'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'

export const prerender = false // Force SSR for this endpoint

const ROUTE = '/api/gdpr/request-data'

const jsonResponse = (body: unknown, status: number, headers?: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  })

const buildRateLimitResponse = (reset: number | undefined) => {
  const retryAfterSeconds = reset ? Math.max(0, Math.ceil((reset - Date.now()) / 1000)) : 60

  return jsonResponse(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Try again in ${retryAfterSeconds}s`,
      },
    } satisfies ErrorResponse,
    429,
    {
      'Retry-After': String(retryAfterSeconds),
    },
  )
}

const buildValidationError = (message: string) =>
  jsonResponse(
    {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message,
      },
    } satisfies ErrorResponse,
    400,
  )

/**
 * POST /api/gdpr/request-data
 * Initiates a DSAR (Data Subject Access Request) for data access or deletion
 * Sends verification email with token
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Rate limiting (use export limiter - 5 requests per minute)
  const { success, reset } = await checkRateLimit(rateLimiters.export, clientAddress)

  if (!success) {
    return buildRateLimitResponse(reset)
  }

  try {
    const body: DSARRequestInput = await request.json()

    // Validate request
    if (!body.email || !body.requestType) {
      return buildValidationError('Email and request type are required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return buildValidationError('Invalid email format')
    }

    // Validate request type
    if (!['ACCESS', 'DELETE'].includes(body.requestType)) {
      return buildValidationError('Request type must be ACCESS or DELETE')
    }

    const email = body.email.toLowerCase().trim()
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Check for existing unfulfilled request for this email
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('dsar_requests')
      .select('*')
      .eq('email', email)
      .eq('request_type', body.requestType)
      .is('fulfilled_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existingError) {
      throw new ApiFunctionError(existingError, {
        route: ROUTE,
        operation: 'fetch-existing-request',
        status: 500,
        details: {
          email,
          requestType: body.requestType,
        },
      })
    }

    if (existing) {
      // Resend verification email with existing token
      await sendDSARVerificationEmail(email, existing.token, body.requestType)

      return jsonResponse(
        {
          success: true,
          message: 'Verification email sent. Please check your inbox.',
        } satisfies DSARResponse,
        200,
      )
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
      throw new ApiFunctionError(error, {
        route: ROUTE,
        operation: 'create-request',
        status: 500,
        details: {
          email,
          requestType: body.requestType,
        },
      })
    }

    // Send verification email
    await sendDSARVerificationEmail(email, token, body.requestType)

    return jsonResponse(
      {
        success: true,
        message: 'Verification email sent. Please check your inbox and click the link to complete your request.',
      } satisfies DSARResponse,
      201,
    )
  } catch (error) {
    const serverError = handleApiFunctionError(error, {
      route: ROUTE,
      operation: 'POST',
      extra: {
        clientAddress,
      },
    })

    return jsonResponse(
      {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: serverError.status >= 400 && serverError.status < 500
            ? serverError.message
            : 'Failed to process request. Please try again.',
        },
      } satisfies ErrorResponse,
      serverError.status ?? 500,
    )
  }
}
