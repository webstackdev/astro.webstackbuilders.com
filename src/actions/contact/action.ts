import { Resend } from 'resend'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro/zod'
import { checkContactRateLimit } from '@actions/utils/rateLimit'
import { buildRequestFingerprint, createRateLimitIdentifier } from '@actions/utils/requestContext'
import { getPrivacyPolicyVersion, getResendApiKey, isProd } from '@actions/utils/environment/environmentActions'
import { ActionsFunctionError, throwActionError } from '@actions/utils/errors'
import { createConsentRecord } from '@actions/gdpr/domain/consentStore'
import type { FileAttachment, EmailData } from '@actions/contact/@types'
import {
  contactTimelineValues,
  generateEmailContent,
  getFormDataFromInput,
  parseAttachmentsFromInput,
  validateInput
} from './domain'

const trimString = (value: unknown): unknown => (typeof value === 'string' ? value.trim() : value)

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

const optionalTrimmedString = (maxLength?: number) => {
  const base = z.string()
  const limited = typeof maxLength === 'number' ? base.max(maxLength) : base
  return z.preprocess(emptyStringToUndefined, limited.optional())
}

const requiredTrimmedString = (minLength = 1, maxLength?: number) => {
  const base = z.preprocess(trimString, z.string().min(minLength))
  return typeof maxLength === 'number' ? base.pipe(z.string().max(maxLength)) : base
}

const isFile = (value: unknown): value is File => typeof File !== 'undefined' && value instanceof File
const optionalFile = () => z.custom<File>(isFile).optional()

const contactFormInputSchema = z
  .object({
    /** Core fields used by the action. */
    name: requiredTrimmedString(2, 100),
    email: z.preprocess(trimString, z.string().email().max(254)),
    message: requiredTrimmedString(10, 2000),
    /** Extra fields submitted by the form UI. */
    company: optionalTrimmedString(100),
    phone: optionalTrimmedString(50),
    'project_type': optionalTrimmedString(50),
    budget: z.preprocess(trimString, z.enum(['5k-10k', '10k-25k', '25k-50k', '50k+'])),
    timeline: z.preprocess(emptyStringToUndefined, z.enum(contactTimelineValues).optional()),
    /** Consent checkbox: value="true" when checked, otherwise missing. */
    consent: z.preprocess((value) => (value === 'true' ? true : false), z.boolean()).optional(),
    /** Optional hidden field supported by the action. */
    'DataSubjectId': z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
    /** Backwards-compatible optional fields (older contact forms). */
    service: optionalTrimmedString(100),
    website: optionalTrimmedString(200),
    /** File uploads (not implemented in the UI yet). When implemented, we expect keys like file1..file5. */
    file1: optionalFile(),
    file2: optionalFile(),
    file3: optionalFile(),
    file4: optionalFile(),
    file5: optionalFile(),
  })
  .passthrough()

async function sendEmail(emailData: EmailData, files: FileAttachment[]): Promise<void> {
  if (!isProd()) {
    return
  }

  const resend = new Resend(getResendApiKey())
  const attachments = files.map(file => ({ filename: file.filename, content: file.content }))

  const result = await resend.emails.send({
    from: emailData.from,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html,
    ...(attachments.length > 0 && { attachments }),
  })

  if (!result.data) {
    throw new ActionsFunctionError('Failed to send email. Please try again later.', { status: 502 })
  }
}

export const contact = {
  submit: defineAction({
    accept: 'form',
    input: contactFormInputSchema,
    handler: async (input, context): Promise<{ success: true; message: string }> => {
      const route = '/_actions/contact/submit'

      try {
        const { fingerprint } = buildRequestFingerprint({
          route,
          request: context.request,
          cookies: context.cookies,
          clientAddress: context.clientAddress,
        })

        const rateLimitIdentifier = createRateLimitIdentifier('contact', fingerprint)
        if (!checkContactRateLimit(rateLimitIdentifier)) {
          throw new ActionsFunctionError('Too many form submissions. Please try again later.', { status: 429 })
        }

        const formData = getFormDataFromInput(input)
        const files = await parseAttachmentsFromInput(input)

        const validationErrors = validateInput(formData)
        if (validationErrors.length > 0) {
          throw new ActionsFunctionError(validationErrors[0] ?? 'Invalid form submission', { status: 400 })
        }

        const userAgent = context.request.headers.get('user-agent') || 'unknown'
        const ip =
          context.clientAddress ||
          context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          context.request.headers.get('x-real-ip') ||
          'unknown'

        if (formData.consent) {
          let subjectId = formData.DataSubjectId
          if (!subjectId) {
            subjectId = uuidv4()
          } else if (!uuidValidate(subjectId)) {
            throw new ActionsFunctionError('Invalid DataSubjectId format', { status: 400 })
          }

          await createConsentRecord({
            dataSubjectId: subjectId,
            email: formData.email.trim(),
            purposes: ['contact'],
            source: 'contact_form',
            userAgent,
            ipAddress: ip !== 'unknown' ? ip : null,
            privacyPolicyVersion: getPrivacyPolicyVersion(),
            consentText: null,
            verified: true,
          })
        }

        const htmlContent = generateEmailContent(formData, files)
        await sendEmail(
          {
            from: 'contact@webstackbuilders.com',
            to: 'info@webstackbuilders.com',
            subject: `Contact Form: ${formData.name}`,
            html: htmlContent,
          },
          files,
        )

        return {
          success: true,
          message: 'Thank you for your message. We will get back to you soon!',
        }
      } catch (error) {
        if (error instanceof ActionsFunctionError) {
          throw error
        }
        if (error instanceof ActionError) {
          throw error
        }
        throwActionError(error, { route, operation: 'submit' })
      }
    },
  }),
}
