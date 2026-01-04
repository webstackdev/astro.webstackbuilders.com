import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import { defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { getPrivacyPolicyVersion } from '@actions/utils/environment/environmentActions'
import { checkRateLimit, rateLimiters } from '@actions/utils/rateLimit'
import { buildRequestFingerprint, createRateLimitIdentifier } from '@actions/utils/requestContext'
import {
  ActionsFunctionError,
  handleActionsFunctionError,
  throwActionError,
} from '@actions/utils/errors'
import { createConsentRecord, markConsentRecordsVerified } from '@actions/gdpr/entities/consent'
import { createPendingSubscription, confirmSubscription } from '@actions/newsletter/domain'
import { validateEmail } from '@actions/newsletter/utils'
import { sendConfirmationEmail, sendWelcomeEmail } from '@actions/newsletter/entities/email'
import { subscribeToConvertKit } from '@actions/newsletter/entities/subscribe'

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
      context
    ): Promise<{ success: true; message: string; requiresConfirmation: true }> => {
      const route = '/_actions/newsletter/subscribe'

      try {
        const { fingerprint } = buildRequestFingerprint({
          route,
          request: context.request,
          cookies: context.cookies,
          clientAddress: context.clientAddress,
        })

        const rateLimitIdentifier = createRateLimitIdentifier('newsletter:consent', fingerprint)
        const { success, reset } = await checkRateLimit(rateLimiters.consent, rateLimitIdentifier)

        if (!success) {
          const retryAfterMs = typeof reset === 'number' ? Math.max(0, reset - Date.now()) : 0
          const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
          throw new ActionsFunctionError(`Try again in ${retryAfterSeconds}s`, { status: 429 })
        }

        const validatedEmail = validateEmail(body.email)

        if (!body.consentGiven) {
          throw new ActionsFunctionError(
            'You must consent to receive marketing emails to subscribe.',
            { status: 400 }
          )
        }

        const userAgent = context.request.headers.get('user-agent') || 'unknown'

        let subjectId = body.DataSubjectId
        if (!subjectId) {
          subjectId = uuidv4()
        } else if (!uuidValidate(subjectId)) {
          throw new ActionsFunctionError('Invalid DataSubjectId format', { status: 400 })
        }

        await createConsentRecord({
          dataSubjectId: subjectId,
          email: validatedEmail,
          purposes: ['marketing'],
          source: 'newsletter_form',
          userAgent,
          ipAddress:
            context.clientAddress && context.clientAddress !== 'unknown'
              ? context.clientAddress
              : null,
          privacyPolicyVersion: getPrivacyPolicyVersion(),
          consentText: null,
          verified: false,
        })

        const token = await createPendingSubscription({
          email: validatedEmail,
          ...(body.firstName && { firstName: body.firstName }),
          DataSubjectId: subjectId,
          userAgent,
          ...(context.clientAddress &&
            context.clientAddress !== 'unknown' && { ipAddress: context.clientAddress }),
          source: 'newsletter_form',
        })

        await sendConfirmationEmail(validatedEmail, token, body.firstName)

        return {
          success: true,
          message: 'Please check your email to confirm your subscription.',
          requiresConfirmation: true,
        }
      } catch (error) {
        if (error instanceof ActionsFunctionError) {
          throw error
        }
        throwActionError(error, { route, operation: 'subscribe' })
      }
    },
  }),

  confirm: defineAction({
    accept: 'json',
    input: confirmSchema,
    handler: async (
      input
    ): Promise<{
      success: boolean
      status: 'success' | 'expired'
      email?: string
      message: string
    }> => {
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
        handleActionsFunctionError(emailError, {
          route: '/_actions/newsletter/confirm',
          operation: 'sendWelcomeEmail',
        })
      }

      try {
        await subscribeToConvertKit({
          email: subscription.email,
          ...(subscription.firstName ? { firstName: subscription.firstName } : {}),
        })
      } catch (convertKitError) {
        handleActionsFunctionError(convertKitError, {
          route: '/_actions/newsletter/confirm',
          operation: 'subscribeToConvertKit',
        })
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
