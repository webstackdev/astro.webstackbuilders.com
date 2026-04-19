import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import { defineAction } from 'astro:actions'
import { z } from 'astro/zod'
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
import { createOrUpdateContact, addContactToNewsletterList, setMarketingOptIn } from '@actions/utils/hubspot'

const subscribeSchema = z.object({
  email: z.string(),
  firstName: z.string().optional(),
  consentGiven: z.boolean().optional(),
  DataSubjectId: z.string().optional(),
})

const confirmSchema = z.object({
  token: z.string().min(1),
})

type NewsletterSubscribeStage =
  | 'buildRequestFingerprint'
  | 'checkRateLimit'
  | 'validateEmail'
  | 'validateConsent'
  | 'resolveDataSubjectId'
  | 'createConsentRecord'
  | 'createPendingSubscription'
  | 'sendConfirmationEmail'

const getEmailDomain = (email: string): string | undefined => {
  const normalizedEmail = email.trim().toLowerCase()
  const atIndex = normalizedEmail.lastIndexOf('@')

  if (atIndex === -1 || atIndex === normalizedEmail.length - 1) {
    return undefined
  }

  return normalizedEmail.slice(atIndex + 1)
}

const buildSubscribeErrorExtra = (options: {
  body: z.infer<typeof subscribeSchema>
  fingerprint?: string
  consentFunctional: boolean
  stage: NewsletterSubscribeStage
  userAgent: string
  clientAddress?: string
  rateLimitIdentifier?: string
  subjectIdSource: 'generated' | 'provided' | 'pending'
}): Record<string, unknown> => {
  return {
    stage: options.stage,
    source: 'newsletter_form',
    consentFunctional: options.consentFunctional,
    fingerprint: options.fingerprint,
    request: {
      hasClientAddress:
        typeof options.clientAddress === 'string' && options.clientAddress !== 'unknown',
      hasUserAgent: options.userAgent !== 'unknown',
      rateLimitIdentifier: options.rateLimitIdentifier,
    },
    input: {
      emailDomain: getEmailDomain(options.body.email),
      emailLength: options.body.email.trim().length,
      consentGiven: Boolean(options.body.consentGiven),
      hasFirstName:
        typeof options.body.firstName === 'string' && options.body.firstName.trim().length > 0,
      hasDataSubjectId:
        typeof options.body.DataSubjectId === 'string' && options.body.DataSubjectId.length > 0,
      subjectIdSource: options.subjectIdSource,
    },
  }
}

export const newsletter = {
  subscribe: defineAction({
    accept: 'json',
    input: subscribeSchema,
    handler: async (
      body: z.infer<typeof subscribeSchema>,
      context
    ): Promise<{ success: true; message: string; requiresConfirmation: true }> => {
      const route = '/_actions/newsletter/subscribe'
      let stage: NewsletterSubscribeStage = 'buildRequestFingerprint'
      let fingerprint: string | undefined
      let consentFunctional = false
      let rateLimitIdentifier: string | undefined
      let subjectIdSource: 'generated' | 'provided' | 'pending' = 'pending'
      const userAgent = context.request.headers.get('user-agent') || 'unknown'

      try {
        const requestFingerprint = buildRequestFingerprint({
          route,
          request: context.request,
          cookies: context.cookies,
          clientAddress: context.clientAddress,
        })

        fingerprint = requestFingerprint.fingerprint
        consentFunctional = requestFingerprint.consentFunctional

        stage = 'checkRateLimit'
        rateLimitIdentifier = createRateLimitIdentifier('newsletter:consent', fingerprint)
        const { success, reset } = await checkRateLimit(rateLimiters.consent, rateLimitIdentifier)

        if (!success) {
          const retryAfterMs = typeof reset === 'number' ? Math.max(0, reset - Date.now()) : 0
          const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
          throw new ActionsFunctionError(`Try again in ${retryAfterSeconds}s`, { status: 429 })
        }

        stage = 'validateEmail'
        const validatedEmail = validateEmail(body.email)

        stage = 'validateConsent'
        if (!body.consentGiven) {
          throw new ActionsFunctionError(
            'You must consent to receive marketing emails to subscribe.',
            { status: 400 }
          )
        }

        stage = 'resolveDataSubjectId'
        let subjectId = body.DataSubjectId
        if (!subjectId) {
          subjectId = uuidv4()
          subjectIdSource = 'generated'
        } else if (!uuidValidate(subjectId)) {
          throw new ActionsFunctionError('Invalid DataSubjectId format', { status: 400 })
        } else {
          subjectIdSource = 'provided'
        }

        stage = 'createConsentRecord'
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

        stage = 'createPendingSubscription'
        const token = await createPendingSubscription({
          email: validatedEmail,
          ...(body.firstName && { firstName: body.firstName }),
          DataSubjectId: subjectId,
          userAgent,
          ...(context.clientAddress &&
            context.clientAddress !== 'unknown' && { ipAddress: context.clientAddress }),
          source: 'newsletter_form',
        })

        stage = 'sendConfirmationEmail'
        await sendConfirmationEmail(validatedEmail, token, body.firstName)

        return {
          success: true,
          message: 'Please check your email to confirm your subscription.',
          requiresConfirmation: true,
        }
      } catch (error) {
        const errorContext = {
          route,
          operation: 'subscribe',
          extra: buildSubscribeErrorExtra({
            body,
            fingerprint,
            consentFunctional,
            stage,
            userAgent,
            clientAddress: context.clientAddress,
            rateLimitIdentifier,
            subjectIdSource,
          }),
        } as const

        if (error instanceof ActionsFunctionError) {
          handleActionsFunctionError(error, errorContext)
          throw error
        }

        throwActionError(error, errorContext)
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
        const contact = await createOrUpdateContact({
          email: subscription.email,
          ...(subscription.firstName ? { firstname: subscription.firstName } : {}),
        })
        await setMarketingOptIn(contact.id, true)
        await addContactToNewsletterList(contact.id)
      } catch (hubspotError) {
        handleActionsFunctionError(hubspotError, {
          route: '/_actions/newsletter/confirm',
          operation: 'hubspotSubscribe',
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
