import { Buffer } from 'node:buffer'
import emailValidator from 'email-validator'
import { ActionsFunctionError } from '@actions/utils/errors'
import { escapeHtml, formatFileSize } from './utils'
import type { ContactFormData, ContactTimeline, FileAttachment } from '@actions/contact/@types'

export const contactTimelineValues = [
  'asap',
  '1-month',
  '2-3-months',
  '3-6-months',
  '6-months-plus',
  'flexible',
] as const satisfies readonly [ContactTimeline, ...ContactTimeline[]]

export const isAllowedTimeline = (timeline: string): timeline is ContactTimeline => {
  return (contactTimelineValues as readonly string[]).includes(timeline)
}

const readInputString = (input: Record<string, unknown>, key: string): string => {
  const value = input[key]
  return typeof value === 'string' ? value : ''
}

const readInputBoolean = (input: Record<string, unknown>, key: string): boolean => {
  const value = input[key]
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === 'true'
  return false
}

export function generateEmailContent(data: ContactFormData, files: FileAttachment[]): string {
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

export function getFormDataFromInput(input: Record<string, unknown>): ContactFormData {
  const formData: ContactFormData = {
    name: readInputString(input, 'name'),
    email: readInputString(input, 'email'),
    message: readInputString(input, 'message'),
    consent: readInputBoolean(input, 'consent'),
  }

  const phone = readInputString(input, 'phone')
  const budget = readInputString(input, 'budget')
  const timeline = readInputString(input, 'timeline')
  const website = readInputString(input, 'website')

  // The current Contact form uses `project_type`; map it into `service` for now.
  const projectType = readInputString(input, 'project_type')
  const legacyService = readInputString(input, 'service')
  const service = projectType || legacyService

  const dataSubjectId = readInputString(input, 'DataSubjectId')

  if (phone) formData.phone = phone
  if (budget) formData.budget = budget
  // Assertion OK because it is validated by Zod
  if (timeline) formData.timeline = timeline as (typeof contactTimelineValues)[number]
  if (website) formData.website = website
  if (service) formData.service = service
  if (dataSubjectId) formData.DataSubjectId = dataSubjectId

  return formData
}

export async function parseAttachments(form: FormData): Promise<FileAttachment[]> {
  const files: FileAttachment[] = []
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/quicktime',
    'application/zip',
    'text/plain',
  ]
  const maxFileSize = 10 * 1024 * 1024
  const maxFiles = 5

  let fileCount = 0
  for (const [key, value] of form.entries()) {
    if (key.startsWith('file') && value instanceof File && value.size > 0) {
      fileCount++

      if (fileCount > maxFiles) {
        throw new ActionsFunctionError(`Maximum ${maxFiles} files allowed`, { status: 400 })
      }

      if (value.size > maxFileSize) {
        throw new ActionsFunctionError(`File ${value.name} exceeds 10MB limit`, { status: 400 })
      }

      if (!allowedTypes.includes(value.type)) {
        throw new ActionsFunctionError(`File type ${value.type} not allowed`, { status: 400 })
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

export async function parseAttachmentsFromInput(
  input: Record<string, unknown>
): Promise<FileAttachment[]> {
  const files: FileAttachment[] = []
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/quicktime',
    'application/zip',
    'text/plain',
  ]
  const maxFileSize = 10 * 1024 * 1024
  const maxFiles = 5

  let fileCount = 0
  for (const [key, value] of Object.entries(input)) {
    if (!key.startsWith('file')) continue
    if (!(value instanceof File) || value.size <= 0) continue

    fileCount++
    if (fileCount > maxFiles) {
      throw new ActionsFunctionError(`Maximum ${maxFiles} files allowed`, { status: 400 })
    }

    if (value.size > maxFileSize) {
      throw new ActionsFunctionError(`File ${value.name} exceeds 10MB limit`, { status: 400 })
    }

    if (!allowedTypes.includes(value.type)) {
      throw new ActionsFunctionError(`File type ${value.type} not allowed`, { status: 400 })
    }

    const buffer = Buffer.from(await value.arrayBuffer())
    files.push({
      filename: value.name,
      content: buffer,
      contentType: value.type,
      size: value.size,
    })
  }

  return files
}

export function validateInput(body: ContactFormData): string[] {
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

  if (body.timeline && !isAllowedTimeline(body.timeline)) {
    errors.push('Invalid project timeline')
  }

  const spamPatterns = ['viagra', 'cialis', 'casino', 'poker', 'lottery']
  const messageContent = `${body.name} ${body.email} ${body.message}`.toLowerCase()
  if (spamPatterns.some(pattern => messageContent.includes(pattern))) {
    errors.push('Message appears to contain spam')
  }

  return errors
}
