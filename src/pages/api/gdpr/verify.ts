import type { APIRoute } from 'astro'
import { rateLimiters, checkRateLimit, supabaseAdmin } from '@pages/api/_utils'
import type { DSARRequest } from '@pages/api/_contracts/gdpr.contracts'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
import { createApiFunctionContext, createRateLimitIdentifier } from '@pages/api/_utils/requestContext'

export const prerender = false // Force SSR for this endpoint

const ROUTE = '/api/gdpr/verify'

const buildRateLimitError = (reset: number | undefined) => {
  const retryAfterMs = typeof reset === 'number' ? Math.max(0, reset - Date.now()) : 0
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
  return new ApiFunctionError({
    message: `Too many requests. Try again in ${retryAfterSeconds}s`,
    status: 429,
    code: 'RATE_LIMIT_EXCEEDED',
    details: { retryAfterSeconds },
  })
}

const buildErrorResponse = (
  error: unknown,
  context: ReturnType<typeof createApiFunctionContext>['context'],
  fallbackMessage: string,
) => {
  const serverError = handleApiFunctionError(error, context)
  const retryAfterSecondsRaw = serverError.details?.['retryAfterSeconds']
  const options: {
    fallbackMessage: string
    headers?: HeadersInit
  } = {
    fallbackMessage,
  }

  if (typeof retryAfterSecondsRaw === 'number') {
    options.headers = { 'Retry-After': String(Math.max(1, Math.ceil(retryAfterSecondsRaw))) }
  }

  return buildApiErrorResponse(serverError, options)
}

/**
 * GET /api/gdpr/verify?token=xxx
 * Verifies DSAR token and fulfills the request (data access or deletion)
 */
export const GET: APIRoute = async ({ request, clientAddress, cookies, redirect }) => {
  const { context: apiContext, fingerprint } = createApiFunctionContext({
    route: ROUTE,
    operation: 'GET',
    request,
    cookies,
    clientAddress,
  })

  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const rateLimitIdentifier = createRateLimitIdentifier('gdpr:dsar:verify', fingerprint)
  const { success, reset } = await checkRateLimit(rateLimiters.export, rateLimitIdentifier)

  if (!success) {
    return buildErrorResponse(buildRateLimitError(reset), apiContext, 'Too many requests')
  }

  if (!token) {
    return buildErrorResponse(
      new ApiFunctionError({
        message: 'Verification token is required',
        status: 400,
        code: 'INVALID_REQUEST',
      }),
      apiContext,
      'Verification token is required',
    )
  }

  apiContext.extra = { ...(apiContext.extra || {}), token }

  try {
    // Find the DSAR request
    const { data: dsarRequestData, error: fetchError } = await supabaseAdmin
      .from('dsar_requests')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (fetchError) {
      throw new ApiFunctionError(fetchError, {
        route: ROUTE,
        operation: 'fetch-request',
        status: 500,
        details: {
          token,
        },
      })
    }

    if (!dsarRequestData) {
      return redirect('/privacy/my-data?status=invalid')
    }

    // Type the DSAR request data properly
    const dsarRequest: DSARRequest = {
      id: dsarRequestData.id,
      token: dsarRequestData.token,
      email: dsarRequestData.email,
      requestType: dsarRequestData.request_type,
      expiresAt: dsarRequestData.expires_at,
      fulfilledAt: dsarRequestData.fulfilled_at,
      createdAt: dsarRequestData.created_at,
    }

    // Check if already fulfilled
    if (dsarRequest.fulfilledAt) {
      return redirect('/privacy/my-data?status=already-completed')
    }

    // Check if expired
    if (new Date(dsarRequest.expiresAt) < new Date()) {
      return redirect('/privacy/my-data?status=expired')
    }

    const email = dsarRequest.email
    const requestType = dsarRequest.requestType

    if (requestType === 'ACCESS') {
      // Export all consent data for this email
      const { data: consentRecords, error: consentError } = await supabaseAdmin
        .from('consent_records')
        .select('*')
        .eq('email', email)

      if (consentError) {
        throw new ApiFunctionError(consentError, {
          route: ROUTE,
          operation: 'fetch-consent-records',
          status: 500,
          details: {
            email,
          },
        })
      }

      // Mark request as fulfilled
      const { error: fulfillError } = await supabaseAdmin
        .from('dsar_requests')
        .update({ fulfilled_at: new Date().toISOString() })
        .eq('token', token)

      if (fulfillError) {
        throw new ApiFunctionError(fulfillError, {
          route: ROUTE,
          operation: 'mark-request-fulfilled',
          status: 500,
          details: {
            token,
            requestType,
          },
        })
      }

      // Return data as JSON download
      const exportData = {
        email,
        requestDate: dsarRequest.createdAt,
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
      const { error: deleteConsentsError } = await supabaseAdmin
        .from('consent_records')
        .delete()
        .eq('email', email)

      if (deleteConsentsError) {
        throw new ApiFunctionError(deleteConsentsError, {
          route: ROUTE,
          operation: 'delete-consent-records',
          status: 500,
          details: {
            email,
          },
        })
      }

      // Delete newsletter confirmations
      const { error: deleteConfirmationsError } = await supabaseAdmin
        .from('newsletter_confirmations')
        .delete()
        .eq('email', email)

      if (deleteConfirmationsError) {
        throw new ApiFunctionError(deleteConfirmationsError, {
          route: ROUTE,
          operation: 'delete-newsletter-confirmations',
          status: 500,
          details: {
            email,
          },
        })
      }

      // Mark request as fulfilled
      const { error: deleteFulfillError } = await supabaseAdmin
        .from('dsar_requests')
        .update({ fulfilled_at: new Date().toISOString() })
        .eq('token', token)

      if (deleteFulfillError) {
        throw new ApiFunctionError(deleteFulfillError, {
          route: ROUTE,
          operation: 'mark-delete-request-fulfilled',
          status: 500,
          details: {
            token,
          },
        })
      }

      // Redirect to success page
      return redirect('/privacy/my-data?status=deleted')
    }

    return redirect('/privacy/my-data?status=error')
  } catch (error) {
    apiContext.extra = {
      ...(apiContext.extra || {}),
      clientAddress,
    }
    handleApiFunctionError(error, apiContext)
    return redirect('/privacy/my-data?status=error')
  }
}
