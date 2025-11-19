/**
 * Newsletter Confirmation API Endpoint
 * Handles token validation and subscription confirmation
 * This is an Astro API route that runs server-side
 */
import type { APIRoute } from 'astro'
import { supabaseAdmin } from '@pages/api/_utils'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'

// These imports work in Astro API routes because they run server-side
import { confirmSubscription } from './_token'
import { sendWelcomeEmail } from './_email'

export const prerender = false // Force SSR for this endpoint

const ROUTE = '/api/newsletter/confirm'

const jsonResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token')

  if (!token) {
    return jsonResponse(
      {
        success: false,
        status: 'invalid',
        error: 'No token provided',
      },
      400,
    )
  }

  try {
    // Validate and confirm the subscription
    const subscription = await confirmSubscription(token)

    if (!subscription) {
      return jsonResponse(
        {
          success: false,
          status: 'expired',
          message: 'This confirmation link has expired or been used already.',
        },
        400,
      )
    }

    // Mark consent as verified in Supabase
    // Find the most recent unverified consent record for this email and DataSubjectId
    const { error: consentError } = await supabaseAdmin
      .from('consent_records')
      .update({ verified: true })
      .eq('email', subscription.email)
      .eq('data_subject_id', subscription.DataSubjectId)
      .eq('verified', false)
      .contains('purposes', ['marketing'])

    if (consentError) {
      throw new ApiFunctionError(consentError, {
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
      await sendWelcomeEmail(subscription.email, subscription.firstName)
    } catch (emailError) {
      handleApiFunctionError(emailError, {
        route: ROUTE,
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
        route: ROUTE,
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
    const serverError = handleApiFunctionError(error, {
      route: ROUTE,
      operation: 'GET',
      extra: {
        token,
      },
    })

    return jsonResponse(
      {
        success: false,
        status: 'error',
        error: serverError.message,
      },
      serverError.status ?? 500,
    )
  }
}
