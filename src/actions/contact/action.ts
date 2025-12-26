import { Buffer } from 'node:buffer'
import { Resend } from 'resend'
import emailValidator from 'email-validator'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import { ActionError, defineAction } from 'astro:actions'
import { checkContactRateLimit } from '@actions/utils/rateLimit'
import { buildRequestFingerprint, createRateLimitIdentifier } from '@actions/utils/requestContext'
import { getPrivacyPolicyVersion, getResendApiKey, isProd } from '@actions/utils/environment/environmentActions'
import { createConsentRecord } from '@actions/gdpr/domain/consentStore'

type ContactFormData = {
  name: string
  email: string
  phone?: string
  message: string
  consent?: boolean
  DataSubjectId?: string
  service?: string
  budget?: string
  timeline?: string
  website?: string
}

type FileAttachment = {
  filename: string
  content: Buffer
  contentType: string
  size: number
}

type EmailData = {
  from: string
  to: string
  subject: string
  html: string
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, char => map[char] || char)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function validateInput(body: ContactFormData): string[] {
  const errors: string[] = []

  if (!body.name?.trim()) {
    errors.push('Name is required')
  } else if (body.name.length < 2) {
    errors.push('Name must be at least 2 characters')
  } else if (body.name.length > 100) {
    errors.push('Name must be less than 100 characters')
  }

  if (!body.email?.trim()) {
    errors.push('Email is required')
  } else if (!emailValidator.validate(body.email.trim())) {
    errors.push('Invalid email address')
  }

  if (!body.message?.trim()) {
    errors.push('Message is required')
  } else if (body.message.length < 10) {
    errors.push('Message must be at least 10 characters')
  } else if (body.message.length > 2000) {
    errors.push('Message must be less than 2000 characters')
  }

  const spamPatterns = ['viagra', 'cialis', 'casino', 'poker', 'lottery']
  const messageContent = `${body.name} ${body.email} ${body.message}`.toLowerCase()
  if (spamPatterns.some(pattern => messageContent.includes(pattern))) {
    errors.push('Message appears to contain spam')
  }

  return errors
}

function generateEmailContent(data: ContactFormData, files: FileAttachment[]): string {
  const fields = [
    `<p><strong>Name:</strong> ${escapeHtml(data.name)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(data.email)}</p>`,
  ]

  if (data.phone) fields.push(`<p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>`)
  if (data.service) fields.push(`<p><strong>Service:</strong> ${escapeHtml(data.service)}</p>`)
  if (data.budget) fields.push(`<p><strong>Budget:</strong> ${escapeHtml(data.budget)}</p>`)
  if (data.timeline) fields.push(`<p><strong>Timeline:</strong> ${escapeHtml(data.timeline)}</p>`)
  if (data.website) fields.push(`<p><strong>Website:</strong> ${escapeHtml(data.website)}</p>`)

  fields.push('<p><strong>Message:</strong></p>')
  fields.push(`<p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>`)

  if (files.length > 0) {
    fields.push('<p><strong>Attachments:</strong></p>')
    fields.push('<ul>')
    files.forEach(file => {
      fields.push(`<li>${escapeHtml(file.filename)} (${formatFileSize(file.size)})</li>`)
    })
    fields.push('</ul>')
  }

  fields.push(`<p><strong>Consent Given:</strong> ${data.consent ? 'Yes' : 'No'}</p>`)

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
p { margin: 10px 0; }
</style>
</head>
<body>
<h1>New Contact Form Submission</h1>
${fields.join('\n')}
</body>
</html>
`.trim()
}

async function sendEmail(emailData: EmailData, files: FileAttachment[]): Promise<void> {
  if (!isProd()) {
    return
  }

  const resend = new Resend(getResendApiKey())
  // @TODO: Resend has a size limit of 40 MB
  const attachments = files.map(file => ({ filename: file.filename, content: file.content }))

  const result = await resend.emails.send({
    from: emailData.from,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html,
    ...(attachments.length > 0 && { attachments }),
  })

  if (!result.data) {
    throw new ActionError({ code: 'BAD_GATEWAY', message: 'Failed to send email. Please try again later.' })
  }
}

function parseBoolean(value: FormDataEntryValue | null): boolean {
  if (value === null) return false
  if (typeof value === 'string') return value === 'true'
  return false
}

function readString(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}

async function parseAttachments(form: FormData): Promise<FileAttachment[]> {
  const files: FileAttachment[] = []
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  const maxFileSize = 10 * 1024 * 1024
  const maxFiles = 5

  let fileCount = 0
  for (const [key, value] of form.entries()) {
    if (key.startsWith('file') && value instanceof File && value.size > 0) {
      fileCount++

      if (fileCount > maxFiles) {
        throw new ActionError({ code: 'BAD_REQUEST', message: `Maximum ${maxFiles} files allowed` })
      }

      if (value.size > maxFileSize) {
        throw new ActionError({ code: 'BAD_REQUEST', message: `File ${value.name} exceeds 10MB limit` })
      }

      if (!allowedTypes.includes(value.type)) {
        throw new ActionError({ code: 'BAD_REQUEST', message: `File type ${value.type} not allowed` })
      }

      const buffer = Buffer.from(await value.arrayBuffer())
      files.push({
        filename: value.name,
        content: buffer,
        contentType: value.type,
        size: value.size,
      })
    }
  }

  return files
}

export const contact = {
  submit: defineAction({
    accept: 'form',
    handler: async (form: FormData, context): Promise<{ success: true; message: string }> => {
      const { fingerprint } = buildRequestFingerprint({
        route: '/_actions/contact/submit',
        request: context.request,
        cookies: context.cookies,
        clientAddress: context.clientAddress,
      })

      const rateLimitIdentifier = createRateLimitIdentifier('contact', fingerprint)
      if (!checkContactRateLimit(rateLimitIdentifier)) {
        throw new ActionError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many form submissions. Please try again later.',
        })
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
        throw new ActionError({ code: 'BAD_REQUEST', message: validationErrors[0] ?? 'Invalid form submission' })
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
          throw new ActionError({ code: 'BAD_REQUEST', message: 'Invalid DataSubjectId format' })
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
    },
  }),
}
