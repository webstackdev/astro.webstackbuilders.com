/**
 * Newsletter Confirmation API Endpoint
 * Handles token validation and subscription confirmation
 * This is an Astro API route that runs server-side
 */
import type { APIRoute } from 'astro'

// These imports work in Astro API routes because they run server-side
import { confirmSubscription } from '../../../../api/newsletter/token'
import { recordConsent } from '../../../../api/shared/consent-log'
import { sendWelcomeEmail } from '../../../../api/newsletter/email'

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token')

  if (!token) {
    return new Response(
      JSON.stringify({
        success: false,
        status: 'invalid',
        error: 'No token provided',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // Validate and confirm the subscription
    const subscription = await confirmSubscription(token)

    if (!subscription) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'expired',
          message: 'This confirmation link has expired or been used already.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Record verified consent in audit trail
    await recordConsent({
      email: subscription.email,
      purposes: ['marketing'],
      source: 'newsletter_form',
      userAgent: subscription.userAgent,
      ipAddress: subscription.ipAddress,
      verified: true,
    })

    // Send welcome email (non-blocking, don't fail if it errors)
    try {
      await sendWelcomeEmail(subscription.email, subscription.firstName)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Continue anyway - subscription is confirmed
    }

    // TODO: Add to ConvertKit with consent timestamp
    // const { subscribeToConvertKit } = await import('../../../../api/newsletter/newsletter')
    // await subscribeToConvertKit({
    //   email: subscription.email,
    //   firstName: subscription.firstName,
    // })

    return new Response(
      JSON.stringify({
        success: true,
        status: 'success',
        email: subscription.email,
        message: 'Your subscription has been confirmed!',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Newsletter confirmation error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
