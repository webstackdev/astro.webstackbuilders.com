/**
 * Astro API endpoint for ConvertKit newsletter subscription
 * Implements GDPR-compliant double opt-in flow
 *
 * With Vercel adapter, this becomes a serverless function automatically
 */
import type { APIRoute } from 'astro'
import { createPendingSubscription } from '../../../../api/newsletter/token'
import { sendConfirmationEmail } from '../../../../api/newsletter/email'
import { recordConsent } from '../../../../api/shared/consent-log'

export const prerender = false // Force SSR for this endpoint

// Types
interface NewsletterFormData {
  email: string
  firstName?: string
  consentGiven?: boolean
}

interface ConvertKitSubscriber {
  email_address: string
  first_name?: string
  state?: 'active' | 'inactive'
  fields?: Record<string, string>
}

interface ConvertKitResponse {
  subscriber: {
    id: number
    first_name: string | null
    email_address: string
    state: string
    created_at: string
    fields: Record<string, string>
  }
}

interface ConvertKitErrorResponse {
  errors: string[]
}

// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, number[]>()

/**
 * Check if the IP address has exceeded the rate limit
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 10
  const key = `newsletter_rate_limit_${ip}`
  const requests = rateLimitStore.get(key) || []

  const validRequests = requests.filter(timestamp => now - timestamp < windowMs)

  if (validRequests.length >= maxRequests) {
    return false
  }

  validRequests.push(now)
  rateLimitStore.set(key, validRequests)
  return true
}

/**
 * Validate email address format
 */
function validateEmail(email: string): string {
  if (!email) {
    throw new Error('Email address is required.')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Email address is invalid')
  }

  return email.trim().toLowerCase()
}

/**
 * Subscribe email to ConvertKit
 */
export async function subscribeToConvertKit(
  data: NewsletterFormData
): Promise<ConvertKitResponse> {
  const apiKey = import.meta.env['CONVERTKIT_API_KEY']

  if (!apiKey) {
    throw new Error('ConvertKit API key is not configured.')
  }

  /* eslint-disable camelcase */
  const subscriberData: ConvertKitSubscriber = {
    email_address: data.email,
    state: 'active',
  }

  if (data.firstName) {
    subscriberData.first_name = data.firstName.trim()
  }
  /* eslint-enable camelcase */

  try {
    const response = await fetch('https://api.kit.com/v4/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': apiKey,
      },
      body: JSON.stringify(subscriberData),
    })

    const responseData = await response.json()

    if (response.status === 401) {
      const errorData = responseData as ConvertKitErrorResponse
      console.error('ConvertKit API authentication failed:', errorData.errors)
      throw new Error('Newsletter service configuration error. Please contact support.')
    }

    if (response.status === 422) {
      const errorData = responseData as ConvertKitErrorResponse
      throw new Error(errorData.errors[0] || 'Invalid email address')
    }

    if (response.status === 200 || response.status === 201 || response.status === 202) {
      return responseData as ConvertKitResponse
    }

    throw new Error('An unexpected error occurred. Please try again later.')
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to connect to newsletter service. Please try again later.')
  }
}

/**
 * Main API handler for newsletter subscriptions
 */
export const POST: APIRoute = async ({ request }) => {
	try {
		// Get client IP and user agent
		const ip =
			request.headers.get('x-forwarded-for')?.split(',')[0] ||
			request.headers.get('x-real-ip') ||
			'unknown'
		const userAgent = request.headers.get('user-agent') || 'unknown'

		// Check rate limit
		if (!checkRateLimit(ip)) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Too many subscription requests. Please try again later.',
				}),
				{
					status: 429,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Parse and validate input
		const body = (await request.json()) as NewsletterFormData
		const { email, firstName, consentGiven } = body
		const validatedEmail = validateEmail(email)

		// Validate GDPR consent
		if (!consentGiven) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'You must consent to receive marketing emails to subscribe.',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				},
			)
		}

		// Record initial (unverified) consent
		await recordConsent({
			email: validatedEmail,
			purposes: ['marketing'],
			source: 'newsletter_form',
			userAgent,
			...(ip !== 'unknown' && { ipAddress: ip }),
			verified: false,
		})

		// Create pending subscription with token
		const token = await createPendingSubscription({
			email: validatedEmail,
			...(firstName && { firstName }),
			userAgent,
			...(ip !== 'unknown' && { ipAddress: ip }),
			source: 'newsletter_form',
		})

		// Send confirmation email
		await sendConfirmationEmail(validatedEmail, token, firstName)

		// Return success response
		return new Response(
			JSON.stringify({
				success: true,
				message: 'Please check your email to confirm your subscription.',
				requiresConfirmation: true,
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		console.error('Newsletter subscription error:', error)

		const errorMessage =
			error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'

		return new Response(
			JSON.stringify({
				success: false,
				error: errorMessage,
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	}
}

// Handle OPTIONS for CORS
export const OPTIONS: APIRoute = async () => {
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	})
}
