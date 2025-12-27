/**
 * Health Check Endpoint
 *
 * Simple endpoint that returns 200 OK to verify API routes are working.
 * Used by monitoring systems and tests to verify service availability.
 */

import type { APIRoute } from 'astro'
import { buildApiErrorResponse, handleApiFunctionError } from '@pages/api/_utils/errors'
import { createApiFunctionContext } from '@pages/api/_utils/requestContext'

export const prerender = false
const ROUTE = '/api/health'

export const GET: APIRoute = async ({ request, clientAddress, cookies }) => {
  const { context: apiContext } = createApiFunctionContext({
    route: ROUTE,
    operation: 'GET',
    request,
    clientAddress,
    cookies,
  })

  try {
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return buildApiErrorResponse(handleApiFunctionError(error, apiContext), {
      fallbackMessage: 'Service unavailable',
    })
  }
}
