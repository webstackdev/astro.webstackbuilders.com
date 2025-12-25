import emailValidator from 'email-validator'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { getConvertkitApiKey, getPrivacyPolicyVersion, isProd } from '@actions/utils/environment/environmentActions'
import { checkRateLimit, rateLimiters } from '@actions/utils/rateLimit'
import { buildRequestFingerprint, createRateLimitIdentifier } from '@actions/utils/requestContext'
import { createConsentRecord, markConsentRecordsVerified } from '@actions/gdpr/domain/consentStore'
import { createPendingSubscription, confirmSubscription } from './_action'
import { sendConfirmationEmail, sendWelcomeEmail } from '@actions/newsletter/entities'

type NewsletterFormData = {
  email: string
  firstName?: string
  consentGiven?: boolean
  DataSubjectId?: string
}

type ConvertKitSubscriber = {
  'email_address': string
  'first_name'?: string
  state?: 'active' | 'inactive'
  fields?: Record<string, string>
}

type ConvertKitResponse = {
  subscriber: {
    id: number
    'first_name': string | null
    'email_address': string
    state: string
    'created_at': string
    fields: Record<string, string>
  }
}

type ConvertKitErrorResponse = {
  errors: string[]
}

function validateEmail(email: string): string {
  if (!email) {
    throw new ActionError({ code: 'BAD_REQUEST', message: 'Email address is required.' })
  }

  if (email.length > 254) {
    throw new ActionError({ code: 'BAD_REQUEST', message: 'Email address is too long' })
  }

  if (!emailValidator.validate(email)) {
    throw new ActionError({ code: 'BAD_REQUEST', message: 'Email address is invalid' })
  }

  return email.trim().toLowerCase()
}

export async function subscribeToConvertKit(data: NewsletterFormData): Promise<ConvertKitResponse> {
  /** Testing helper */
  if (!isProd()) {
    console.log('[DEV/TEST MODE] Newsletter subscription would be created:', { email: data.email })
    return {
      subscriber: {
        id: 999999,
        state: 'active',
        'email_address': data.email,
        'first_name': data.firstName || null,
        'created_at': new Date().toISOString(),
        fields: {},
      },
    }
  }

  const subscriberData: ConvertKitSubscriber = {
    'email_address': data.email,
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
    throw new ActionError({
      code: 'BAD_GATEWAY',
      message: 'Newsletter service configuration error. Please contact support.',
    })
  }

  if (response.status === 422) {
    const errorData = responseData as ConvertKitErrorResponse
    throw new ActionError({ code: 'BAD_REQUEST', message: errorData.errors[0] || 'Invalid email address' })
  }

  if (response.status === 200 || response.status === 201 || response.status === 202) {
    return responseData as ConvertKitResponse
  }

  throw new ActionError({ code: 'BAD_GATEWAY', message: 'An unexpected error occurred. Please try again later.' })
}

const subscribeSchema = z.object({
  email: z.string(),
  firstName: z.string().optional(),
  consentGiven: z.boolean().optional(),
  DataSubjectId: z.string().optional(),
})

const confirmSchema = z.object({
  token: z.string().min(1),
})

export const newsletter = {
  subscribe: defineAction({
    accept: 'json',
    input: subscribeSchema,
    handler: async (
      body: z.infer<typeof subscribeSchema>,
      context,
    ): Promise<{ success: true; message: string; requiresConfirmation: true }> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/newsletter/subscribe',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('newsletter:consent', fingerprint)
      const { success, reset } = await checkRateLimit(rateLimiters.consent, rateLimitIdentifier)

      if (!success) {
        const retryAfterMs = typeof reset === 'number' ? Math.max(0, reset - Date.now()) : 0
        const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
        throw new ActionError({ code: 'TOO_MANY_REQUESTS', message: `Try again in ${retryAfterSeconds}s` })
      }

      const validatedEmail = validateEmail(body.email)

      if (!body.consentGiven) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'You must consent to receive marketing emails to subscribe.',
        })
      }

      const userAgent = context.request.headers.get('user-agent') || 'unknown'

      let subjectId = body.DataSubjectId
      if (!subjectId) {
        subjectId = uuidv4()
      } else if (!uuidValidate(subjectId)) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Invalid DataSubjectId format' })
      }

      await createConsentRecord({
        dataSubjectId: subjectId,
        email: validatedEmail,
        purposes: ['marketing'],
        source: 'newsletter_form',
        userAgent,
        ipAddress: context.clientAddress && context.clientAddress !== 'unknown' ? context.clientAddress : null,
        privacyPolicyVersion: getPrivacyPolicyVersion(),
        consentText: null,
        verified: false,
      })

      const token = await createPendingSubscription({
        email: validatedEmail,
        ...(body.firstName && { firstName: body.firstName }),
        DataSubjectId: subjectId,
        userAgent,
        ...(context.clientAddress && context.clientAddress !== 'unknown' && { ipAddress: context.clientAddress }),
        source: 'newsletter_form',
      })

      await sendConfirmationEmail(validatedEmail, token, body.firstName)

      return {
        success: true,
        message: 'Please check your email to confirm your subscription.',
        requiresConfirmation: true,
      }
    },
  }),

  confirm: defineAction({
    accept: 'json',
    input: confirmSchema,
    handler: async (input): Promise<{ success: boolean; status: 'success' | 'expired'; email?: string; message: string }> => {
      const token = input.token
      const subscription = await confirmSubscription(token)

      if (!subscription) {
        return {
          success: false,
          status: 'expired',
          message: 'This confirmation link has expired or been used already.',
        }
      }

      await markConsentRecordsVerified(subscription.email, subscription.DataSubjectId)

      try {
        await sendWelcomeEmail(subscription.email, subscription.firstName)
      } catch (emailError) {
        console.error('[newsletter.confirm] welcome email failed:', emailError)
      }

      try {
        await subscribeToConvertKit({
          email: subscription.email,
          ...(subscription.firstName ? { firstName: subscription.firstName } : {}),
        })
      } catch (convertKitError) {
        console.error('[newsletter.confirm] convertkit subscribe failed:', convertKitError)
      }

      return {
        success: true,
        status: 'success',
        email: subscription.email,
        message: 'Your subscription has been confirmed!',
      }
    },
  }),
}
