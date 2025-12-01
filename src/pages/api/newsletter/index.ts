/**
 * Astro API endpoint for ConvertKit newsletter subscription
 * Implements GDPR-compliant double opt-in flow
 *
 * With Vercel adapter, this becomes a serverless function automatically
 */
import type { APIRoute } from 'astro'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import { getConvertkitApiKey, isDev, isTest } from '@pages/api/_environment/environmentApi'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
import { rateLimiters, checkRateLimit } from '@pages/api/_utils/rateLimit'
import { createApiFunctionContext, createRateLimitIdentifier } from '@pages/api/_utils/requestContext'
import { recordConsent } from '@pages/api/_logger'
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

const E2E_MOCKS_HEADER = 'x-e2e-mocks'

/**
 * Validate email address format and length
 */
function validateEmail(email: string): string {
  if (!email) {
  throw new ApiFunctionError({
    message: 'Email address is required.',
    status: 400,
    code: 'INVALID_EMAIL',
    route: '/api/newsletter',
    operation: 'validateEmail'
  })
  }

  // RFC 5321 specifies max email length of 254 characters
  if (email.length > 254) {
  throw new ApiFunctionError({
    message: 'Email address is too long',
    status: 400,
    code: 'INVALID_EMAIL',
    route: '/api/newsletter',
    operation: 'validateEmail'
  })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
  throw new ApiFunctionError({
    message: 'Email address is invalid',
    status: 400,
    code: 'INVALID_EMAIL',
    route: '/api/newsletter',
    operation: 'validateEmail'
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
  if (isDev() || isTest()) {
    console.log('[DEV/TEST MODE] Newsletter subscription would be created:', { email: data.email })
    // Return mock success response
    return {
      subscriber: {
        id: 999999,
        state: 'active',
        email_address: data.email,
        first_name: data.firstName || null,
        created_at: new Date().toISOString(),
        fields: {},
      },
    }
  }

  const subscriberData: ConvertKitSubscriber = {
    email_address: data.email,
    state: 'active',
  }

  if (data.firstName) {
    subscriberData.first_name = data.firstName.trim()
  }

  try {
    const response = await fetch('https://api.kit.com/v4/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': getConvertkitApiKey(),
      },
      body: JSON.stringify(subscriberData),
    })

    const responseData = await response.json()

    if (response.status === 401) {
      const errorData = responseData as ConvertKitErrorResponse
      console.error('ConvertKit API authentication failed:', errorData.errors)
    throw new ApiFunctionError({
      message: 'Newsletter service configuration error. Please contact support.',
      status: 502,
      code: 'CONVERTKIT_AUTH',
      route: '/api/newsletter',
      operation: 'subscribeToConvertKit'
    })
    }

    if (response.status === 422) {
      const errorData = responseData as ConvertKitErrorResponse
    throw new ApiFunctionError({
      message: errorData.errors[0] || 'Invalid email address',
      status: 400,
      code: 'INVALID_EMAIL',
      route: '/api/newsletter',
      operation: 'subscribeToConvertKit'
    })
    }

    if (response.status === 200 || response.status === 201 || response.status === 202) {
      return responseData as ConvertKitResponse
    }

    throw new ApiFunctionError({
      message: 'An unexpected error occurred. Please try again later.',
      status: 502,
      code: 'CONVERTKIT_UNKNOWN',
      route: '/api/newsletter',
      operation: 'subscribeToConvertKit'
    })
  } catch (error) {
    throw new ApiFunctionError({
      message: 'Failed to connect to newsletter service. Please try again later.',
      cause: error,
      status: 502,
      code: 'CONVERTKIT_NETWORK',
      route: '/api/newsletter',
      operation: 'subscribeToConvertKit'
    })
  }
}

/**
 * Main API handler for newsletter subscriptions
 */
export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const { context: apiContext, fingerprint } = createApiFunctionContext({
    route: '/api/newsletter',
    operation: 'POST',
    request,
    cookies,
    clientAddress,
  })

  const userAgent = request.headers.get('user-agent') || 'unknown'
  apiContext.extra = { ...(apiContext.extra || {}), userAgent }
  const forceMockResend = request.headers.get(E2E_MOCKS_HEADER) === '1'

  try {
    const rateLimitIdentifier = createRateLimitIdentifier('newsletter:consent', fingerprint)
    const consentLimiter = rateLimiters['consent']

    if (!consentLimiter) {
      throw new ApiFunctionError({
        message: 'Rate limiting is not configured for newsletter subscriptions.',
        status: 500,
        code: 'RATE_LIMIT_NOT_CONFIGURED',
      })
    }

    const { success, reset } = await checkRateLimit(consentLimiter, rateLimitIdentifier)

    if (!success) {
      const retryAfterMs = typeof reset === 'number' ? Math.max(0, reset - Date.now()) : 0
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
      throw new ApiFunctionError({
        message: `Try again in ${retryAfterSeconds}s`,
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        details: { retryAfterSeconds },
      })
    }

    let body: NewsletterFormData
    try {
      body = await request.json()
    } catch {
      throw new ApiFunctionError({
        message: 'Invalid JSON payload',
        status: 400,
        code: 'INVALID_JSON',
      })
    }

    const { email, firstName, consentGiven, DataSubjectId } = body
    const validatedEmail = validateEmail(email)

    if (!consentGiven) {
      throw new ApiFunctionError({
        message: 'You must consent to receive marketing emails to subscribe.',
        status: 400,
        code: 'CONSENT_REQUIRED',
      })
    }

    let subjectId = DataSubjectId
    if (!subjectId) {
      subjectId = uuidv4()
    } else if (!uuidValidate(subjectId)) {
      throw new ApiFunctionError({
        message: 'Invalid DataSubjectId format',
        status: 400,
        code: 'INVALID_UUID',
      })
    }

    await recordConsent({
      origin: new URL(request.url).origin,
      DataSubjectId: subjectId,
      email: validatedEmail,
      purposes: ['marketing'],
      source: 'newsletter_form',
      userAgent,
      ...(clientAddress && clientAddress !== 'unknown' && { ipAddress: clientAddress }),
      verified: false,
    })

    const token = await createPendingSubscription({
      email: validatedEmail,
      ...(firstName && { firstName }),
      DataSubjectId: subjectId,
      userAgent,
      ...(clientAddress && clientAddress !== 'unknown' && { clientAddress }),
      source: 'newsletter_form',
    })

    await sendConfirmationEmail(validatedEmail, token, firstName, {
      forceMockResend,
    })

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
    const serverError = handleApiFunctionError(error, apiContext)
    const retryAfterSecondsRaw = serverError.details?.['retryAfterSeconds']
    const retryAfterSeconds =
      typeof retryAfterSecondsRaw === 'number'
        ? Math.max(1, Math.ceil(retryAfterSecondsRaw))
        : undefined

    const responseOptions: {
      fallbackMessage: string
      headers?: HeadersInit
    } = {
      fallbackMessage: 'Failed to process newsletter request.',
    }

    if (retryAfterSeconds) {
      responseOptions.headers = { 'Retry-After': String(retryAfterSeconds) }
    }

    return buildApiErrorResponse(serverError, responseOptions)
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
