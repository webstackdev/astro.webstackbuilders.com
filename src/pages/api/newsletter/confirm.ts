/**
 * Newsletter Confirmation API Endpoint
 * Handles token validation and subscription confirmation
 * This is an Astro API route that runs server-side
 */
import type { APIRoute } from 'astro'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
import { createApiFunctionContext } from '@pages/api/_utils/requestContext'
import { markConsentRecordsVerified } from '@pages/api/gdpr/_utils/consentStore'

// These imports work in Astro API routes because they run server-side
import { confirmSubscription } from './_token'
import { sendWelcomeEmail } from './_email'

const E2E_MOCKS_HEADER = 'x-e2e-mocks'

export const prerender = false // Force SSR for this endpoint

const ROUTE = '/api/newsletter/confirm'

const jsonResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const GET: APIRoute = async ({ url, request, cookies, clientAddress }) => {
  const { context: apiContext } = createApiFunctionContext({
    route: ROUTE,
    operation: 'GET',
    request,
    cookies,
    clientAddress,
  })

  const token = url.searchParams.get('token')
  apiContext.extra = { ...(apiContext.extra || {}), token }
  const forceMockResend = request.headers.get(E2E_MOCKS_HEADER) === '1'

  try {
    if (!token) {
      throw new ApiFunctionError({
        message: 'No token provided',
        status: 400,
        code: 'TOKEN_REQUIRED',
      })
    }

    // Validate and confirm the subscription
    const subscription = await confirmSubscription(token)

    if (!subscription) {
      return jsonResponse(
        {
          success: false,
          status: 'expired',
          message: 'This confirmation link has expired or been used already.',
        },
        200,
      )
    }

    try {
      await markConsentRecordsVerified(subscription.email, subscription.DataSubjectId)
    } catch (error) {
      throw new ApiFunctionError(error, {
        route: ROUTE,
        operation: 'verify-consent-record',
        status: 500,
        details: {
          email: subscription.email,
          dataSubjectId: subscription.DataSubjectId,
        },
      })
    }

    // Send welcome email (non-blocking, don't fail if it errors)
    try {
      await sendWelcomeEmail(subscription.email, subscription.firstName, {
        forceMockResend,
      })
    } catch (emailError) {
      handleApiFunctionError(emailError, {
        ...apiContext,
        operation: 'send-welcome-email',
        extra: {
          email: subscription.email,
        },
      })
    }

    // Add to ConvertKit with verified status
    try {
      const { subscribeToConvertKit } = await import('@pages/api/newsletter/index')
      await subscribeToConvertKit({
        email: subscription.email,
        ...(subscription.firstName ? { firstName: subscription.firstName } : {}),
      })
    } catch (convertKitError) {
      handleApiFunctionError(convertKitError, {
        ...apiContext,
        operation: 'subscribe-convertkit',
        extra: {
          email: subscription.email,
        },
      })
    }

    return jsonResponse(
      {
        success: true,
        status: 'success',
        email: subscription.email,
        message: 'Your subscription has been confirmed!',
      },
      200,
    )
  } catch (error) {
    const serverError = handleApiFunctionError(error, apiContext)

    return buildApiErrorResponse(serverError, {
      fallbackMessage: 'Unable to confirm subscription.',
    })
  }
}
