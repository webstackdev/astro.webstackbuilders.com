import { Resend } from 'resend'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import { ActionError, defineAction } from 'astro:actions'
import { checkContactRateLimit } from '@actions/utils/rateLimit'
import { buildRequestFingerprint, createRateLimitIdentifier } from '@actions/utils/requestContext'
import { getPrivacyPolicyVersion, getResendApiKey, isProd } from '@actions/utils/environment/environmentActions'
import { ActionsFunctionError, throwActionError } from '@actions/utils/errors'
import { createConsentRecord } from '@actions/gdpr/domain/consentStore'
import type { ContactFormData, FileAttachment, EmailData } from '@actions/contact/@types'
import { generateEmailContent, parseAttachments, validateInput } from './domain'
import { parseBoolean, readString } from './utils'

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
    handler: async (form: FormData, context): Promise<{ success: true; message: string }> => {
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

        const formData: ContactFormData = {
          name: readString(form, 'name'),
          email: readString(form, 'email'),
          message: readString(form, 'message'),
          consent: parseBoolean(form.get('consent')),
        }

        const phone = readString(form, 'phone')
        const service = readString(form, 'service')
        const budget = readString(form, 'budget')
        const timeline = readString(form, 'timeline')
        const website = readString(form, 'website')

        if (phone) formData.phone = phone
        if (service) formData.service = service
        if (budget) formData.budget = budget
        if (timeline) formData.timeline = timeline
        if (website) formData.website = website

        const files = await parseAttachments(form)

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
