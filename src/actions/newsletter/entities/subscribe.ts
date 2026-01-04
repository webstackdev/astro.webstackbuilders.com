import { getConvertkitApiKey, isProd } from '@actions/utils/environment/environmentActions'
import { ActionsFunctionError } from '@actions/utils/errors'
import type {
  ConvertKitSubscriber,
  ConvertKitResponse,
  ConvertKitErrorResponse,
  NewsletterFormData
} from '@actions/newsletter/@types'

export async function subscribeToConvertKit(data: NewsletterFormData): Promise<ConvertKitResponse> {
  /** Testing helper */
  if (!isProd()) {
    console.log('[DEV/TEST MODE] Newsletter subscription would be created:', { email: data.email })
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
    subscriberData['first_name'] = data.firstName.trim()
  }

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
    throw new ActionsFunctionError(
      'Newsletter service configuration error. Please contact support.',
      { status: 502 }
    )
  }

  if (response.status === 422) {
    const errorData = responseData as ConvertKitErrorResponse
    throw new ActionsFunctionError(errorData.errors[0] || 'Invalid email address', { status: 400 })
  }

  if (response.status === 200 || response.status === 201 || response.status === 202) {
    return responseData as ConvertKitResponse
  }

  throw new ActionsFunctionError('An unexpected error occurred. Please try again later.', {
    status: 502,
  })
}
