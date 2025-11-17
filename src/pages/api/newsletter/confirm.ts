/**
 * Newsletter Confirmation API Endpoint
 * Handles token validation and subscription confirmation
 * This is an Astro API route that runs server-side
 */
import type { APIRoute } from 'astro'
import { supabaseAdmin } from '@pages/api/_utils'

// These imports work in Astro API routes because they run server-side
import { confirmSubscription } from './_token'
import { sendWelcomeEmail } from './_email'

export const prerender = false // Force SSR for this endpoint

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

    // Mark consent as verified in Supabase
    // Find the most recent unverified consent record for this email and DataSubjectId
    await supabaseAdmin
      .from('consent_records')
      .update({ verified: true })
      .eq('email', subscription.email)
      .eq('data_subject_id', subscription.DataSubjectId)
      .eq('verified', false)
      .contains('purposes', ['marketing'])

    // Send welcome email (non-blocking, don't fail if it errors)
    try {
      await sendWelcomeEmail(subscription.email, subscription.firstName)
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Continue anyway - subscription is confirmed
    }

    // Add to ConvertKit with verified status
    try {
      const { subscribeToConvertKit } = await import('./index')
      await subscribeToConvertKit({
        email: subscription.email,
        ...(subscription.firstName ? { firstName: subscription.firstName } : {}),
      })
    } catch (convertKitError) {
      console.error('Failed to add to ConvertKit:', convertKitError)
      // Continue anyway - we have the consent and can retry later
    }

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
