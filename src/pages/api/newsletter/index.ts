/**
 * Astro API endpoint for ConvertKit newsletter subscription
 * Implements GDPR-compliant double opt-in flow
 *
 * With Vercel adapter, this becomes a serverless function automatically
 */
import type { APIRoute } from 'astro'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'
import { rateLimiters, checkRateLimit } from '@pages/api/_utils/rateLimit'
import type { ErrorResponse } from '@pages/api/_contracts/gdpr.contracts'
import { createPendingSubscription } from './_token'
import { sendConfirmationEmail } from './_email'

export const prerender = false // Force SSR for this endpoint

// Types
interface NewsletterFormData {
  email: string
  firstName?: string
  consentGiven?: boolean
  DataSubjectId?: string // Optional - will be generated if not provided
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

/**
 * Validate email address format and length
 */
function validateEmail(email: string): string {
  if (!email) {
    throw new ClientScriptError({
      message: 'Email address is required.'
    })
  }

  // RFC 5321 specifies max email length of 254 characters
  if (email.length > 254) {
    throw new ClientScriptError({
      message: 'Email address is too long'
    })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ClientScriptError({
      message: 'Email address is invalid'
    })
  }

  return email.trim().toLowerCase()
}

/**
 * Subscribe email to ConvertKit
 */
export async function subscribeToConvertKit(
  data: NewsletterFormData
): Promise<ConvertKitResponse> {
  // Skip actual ConvertKit API call in dev/test environments
  const isDevOrTest = import.meta.env.DEV || import.meta.env.MODE === 'test' || process.env['NODE_ENV'] === 'test'

  if (isDevOrTest) {
    console.log('[DEV/TEST MODE] Newsletter subscription would be created:', { email: data.email })
    // Return mock success response
    return {
      subscriber: {
        id: 999999,
        state: 'active',
        /* eslint-disable camelcase */
        email_address: data.email,
        first_name: data.firstName || null,
        created_at: new Date().toISOString(),
        /* eslint-enable camelcase */
        fields: {},
      },
    }
  }

  const apiKey = import.meta.env['CONVERTKIT_API_KEY']

  if (!apiKey) {
    throw new ClientScriptError({
      message: 'ConvertKit API key is not configured.'
    })
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
      throw new ClientScriptError({
        message: 'Newsletter service configuration error. Please contact support.'
      })
    }

    if (response.status === 422) {
      const errorData = responseData as ConvertKitErrorResponse
      throw new ClientScriptError({
        message: errorData.errors[0] || 'Invalid email address'
      })
    }

    if (response.status === 200 || response.status === 201 || response.status === 202) {
      return responseData as ConvertKitResponse
    }

    throw new ClientScriptError({
      message: 'An unexpected error occurred. Please try again later.'
    })
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new ClientScriptError({
      message: 'Failed to connect to newsletter service. Please try again later.'
    })
  }
}

/**
 * Main API handler for newsletter subscriptions
 */
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
		// Parse and validate input
		const body: NewsletterFormData = await request.json()
		const { email, firstName, consentGiven, DataSubjectId } = body
		const validatedEmail = validateEmail(email)

		// Validate GDPR consent
		if (!consentGiven) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'You must consent to receive marketing emails to subscribe.' }
      } as ErrorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

		// Generate or validate DataSubjectId
		let subjectId = DataSubjectId
		if (!subjectId) {
			subjectId = uuidv4()
		} else if (!uuidValidate(subjectId)) {
			return new Response(JSON.stringify({
				success: false,
				error: { code: 'INVALID_UUID', message: 'Invalid DataSubjectId format' }
			} as ErrorResponse), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		// Record initial (unverified) consent via new GDPR API
		const consentResponse = await fetch(`${new URL(request.url).origin}/api/gdpr/consent`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				DataSubjectId: subjectId,
				email: validatedEmail,
				purposes: ['marketing'],
				source: 'newsletter_form',
				userAgent: request.headers.get('user-agent') || 'unknown',
				...(clientAddress !== 'unknown' && { ipAddress: clientAddress }),
				verified: false,
			}),
		})

		if (!consentResponse.ok) {
			const error = await consentResponse.json()
			console.error('Failed to record consent:', error)
			return new Response(JSON.stringify({
				success: false,
				error: { code: 'INVALID_REQUEST', message: 'Failed to record consent. Please try again.' }
			} as ErrorResponse), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		// Create pending subscription with token
		const token = await createPendingSubscription({
			email: validatedEmail,
			...(firstName && { firstName }),
			DataSubjectId: subjectId,
			userAgent: request.headers.get('user-agent') || 'unknown',
			...(clientAddress !== 'unknown' && { clientAddress: ip }),
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

		return new Response(JSON.stringify({
			success: false,
			error: { code: 'INVALID_REQUEST', message: errorMessage }
		} as ErrorResponse), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
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
