/**
 * API endpoint for download form submissions
 */
import type { APIRoute } from 'astro'
import { ApiFunctionError } from '@pages/api/_errors/ApiFunctionError'
import { handleApiFunctionError } from '@pages/api/_errors/apiFunctionHandler'

export const prerender = false

interface DownloadFormData {
  firstName: string
  lastName: string
  workEmail: string
  jobTitle: string
  companyName: string
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
}

const REQUIRED_FIELDS: Array<keyof DownloadFormData> = [
  'firstName',
  'lastName',
  'workEmail',
  'jobTitle',
  'companyName',
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const buildJsonResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  })

const validateDownloadForm = (payload: Partial<DownloadFormData>): DownloadFormData => {
  const normalized: DownloadFormData = {
    firstName: payload.firstName?.trim() ?? '',
    lastName: payload.lastName?.trim() ?? '',
    workEmail: payload.workEmail?.trim() ?? '',
    jobTitle: payload.jobTitle?.trim() ?? '',
    companyName: payload.companyName?.trim() ?? '',
  }

  const missingFields = REQUIRED_FIELDS.filter((field) => !normalized[field])

  if (missingFields.length) {
    throw new ApiFunctionError({
      message: 'All fields are required',
      status: 400,
      code: 'MISSING_FIELDS',
      details: { missingFields },
    })
  }

  if (!EMAIL_REGEX.test(normalized.workEmail)) {
    throw new ApiFunctionError({
      message: 'Invalid email address',
      status: 400,
      code: 'INVALID_EMAIL',
    })
  }

  return normalized
}

export const POST: APIRoute = async ({ request }) => {
  try {
    let payload: Partial<DownloadFormData>
    try {
      payload = await request.json()
    } catch (parseError) {
      throw new ApiFunctionError({
        message: 'Invalid JSON payload',
        status: 400,
        code: 'INVALID_JSON',
        details: {
          route: '/api/downloads/submit',
        },
      })
    }

    const data = validateDownloadForm(payload)

    // TODO: Integrate with email service (e.g., SendGrid, Mailchimp, HubSpot)
    // TODO: Store submission in database or CRM
    // For now, just log the submission
    console.log('Download form submission:', {
      name: `${data.firstName} ${data.lastName}`,
      email: data.workEmail,
      jobTitle: data.jobTitle,
      company: data.companyName,
      timestamp: new Date().toISOString(),
    })

    return buildJsonResponse(
      {
        success: true,
        message: 'Form submitted successfully',
      },
      200,
    )
  } catch (rawError) {
    const normalizedError =
      rawError instanceof ApiFunctionError
        ? rawError
        : rawError instanceof SyntaxError
        ? new ApiFunctionError({
            message: 'Invalid JSON payload',
            status: 400,
            code: 'INVALID_JSON',
          })
        : rawError

    const serverError = handleApiFunctionError(normalizedError, {
      route: '/api/downloads/submit',
      operation: 'POST',
    })

    const isClientError = serverError.status >= 400 && serverError.status < 500
    const message = isClientError ? serverError.message : 'Internal server error'

    return buildJsonResponse(
      {
        success: false,
        message,
      },
      serverError.status ?? 500,
    )
  }
}
