import type { APIRoute } from 'astro'
import emailValidator from 'email-validator'
import { v4 as uuidv4 } from 'uuid'
import { rateLimiters, checkRateLimit } from '@pages/api/_utils'
import { sendDSARVerificationEmail } from '@pages/api/gdpr/_dsarVerificationEmails'
import type { DSARRequestInput, DSARResponse } from '@pages/api/_contracts/gdpr.contracts'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'
import { createApiFunctionContext, createRateLimitIdentifier } from '@pages/api/_utils/requestContext'
import { createDsarRequest, findActiveRequestByEmail } from '@pages/api/gdpr/_utils/dsarStore'

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

const buildValidationError = (message: string) =>
  new ApiFunctionError({
    message,
    status: 400,
    code: 'INVALID_REQUEST',
  })

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
 * POST /api/gdpr/request-data
 * Initiates a DSAR (Data Subject Access Request) for data access or deletion
 * Sends verification email with token
 */

export const POST: APIRoute = async ({ request, clientAddress, cookies }) => {
  const { context: apiContext, fingerprint } = createApiFunctionContext({
    route: ROUTE,
    operation: 'POST',
    request,
    cookies,
    clientAddress,
  })

  try {
    const rateLimitIdentifier = createRateLimitIdentifier('gdpr:dsar:request', fingerprint)
    const { success, reset } = await checkRateLimit(rateLimiters.export, rateLimitIdentifier)
    if (!success) {
      throw buildRateLimitError(reset)
    }

    let body: DSARRequestInput
    try {
      body = await request.json()
    } catch {
      throw new ApiFunctionError({
        message: 'Invalid JSON payload',
        status: 400,
        code: 'INVALID_JSON',
      })
    }

    if (!body.email || !body.requestType) {
      throw buildValidationError('Email and request type are required')
    }

    if (!emailValidator.validate(body.email)) {
      throw buildValidationError('Invalid email format')
    }

    if (!['ACCESS', 'DELETE'].includes(body.requestType)) {
      throw buildValidationError('Request type must be ACCESS or DELETE')
    }

    const email = body.email.toLowerCase().trim()
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    let existingRequest
    try {
      existingRequest = await findActiveRequestByEmail(email, body.requestType)
    } catch (error) {
      throw new ApiFunctionError(error, {
        route: ROUTE,
        operation: 'fetch-existing-request',
        status: 500,
        details: {
          email,
          requestType: body.requestType,
        },
      })
    }

    if (existingRequest) {
      // Resend verification email with existing token
      await sendDSARVerificationEmail(email, existingRequest.token, body.requestType)

      return jsonResponse(
        {
          success: true,
          message: 'Verification email sent. Please check your inbox.',
        } satisfies DSARResponse,
        200,
      )
    }

    try {
      await createDsarRequest({
        token,
        email,
        requestType: body.requestType,
        expiresAt,
      })
    } catch (error) {
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
    return buildErrorResponse(error, apiContext, 'Failed to process request. Please try again.')
  }
}
