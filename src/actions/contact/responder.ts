import { Buffer } from 'node:buffer'
import { ActionsFunctionError } from '@actions/utils/errors'
import acknowledgementTemplateContent from '@actions/contact/email/acknowledgement.mjml?raw'
import messageTemplateContent from '@actions/contact/email/message.mjml?raw'
import {
  compileEmailTemplate,
  createImportedEmailTemplate,
} from '@actions/utils/email/templateCompiler'
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

const allowedAttachmentTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'application/zip',
  'text/plain',
] as const

type AllowedAttachmentType = (typeof allowedAttachmentTypes)[number]

const isAllowedAttachmentType = (mimeType: string): mimeType is AllowedAttachmentType => {
  return allowedAttachmentTypes.some(allowedAttachmentType => allowedAttachmentType === mimeType)
}

const normalizeMimeType = (mimeType: string): string => {
  return mimeType.split(';')[0]?.trim().toLowerCase() || ''
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

const contactMessageTemplate = createImportedEmailTemplate(
  'src/actions/contact/email/message.mjml',
  messageTemplateContent
)

const contactAcknowledgementTemplate = createImportedEmailTemplate(
  'src/actions/contact/email/acknowledgement.mjml',
  acknowledgementTemplateContent
)

type ContactEmailTemplateData = {
  attachments: Array<{ filename: string; sizeLabel: string }>
  consentGiven: 'Yes' | 'No'
  fields: Array<{ label: string; value: string }>
  messageHtml: string
}

type ContactAcknowledgementTemplateData = {
  greeting: string
  replyToEmail: string
}

const createGreeting = (name: string): string => {
  const trimmedName = name.trim()
  if (!trimmedName) {
    return 'Hello'
  }

  const [firstName] = trimmedName.split(/\s+/)
  return firstName ? `Hi ${firstName}` : 'Hello'
}

/**
 * Builds the template data required by the contact MJML email.
 */
export function createContactEmailTemplateData(
  data: ContactFormData,
  files: FileAttachment[]
): ContactEmailTemplateData {
  const fields = [
    { label: 'Name', value: data.name },
    { label: 'Email', value: data.email },
  ]

  if (data.company) fields.push({ label: 'Company', value: data.company })
  if (data.phone) fields.push({ label: 'Phone', value: data.phone })
  if (data.service) fields.push({ label: 'Service', value: data.service })
  if (data.budget) fields.push({ label: 'Budget', value: data.budget })
  if (data.timeline) fields.push({ label: 'Timeline', value: data.timeline })
  if (data.website) fields.push({ label: 'Website', value: data.website })

  return {
    attachments: files.map(file => ({
      filename: file.filename,
      sizeLabel: formatFileSize(file.size),
    })),
    consentGiven: data.consent ? 'Yes' : 'No',
    fields,
    messageHtml: escapeHtml(data.message).replace(/\n/g, '<br>'),
  }
}

/**
 * Builds the template data required by the contact acknowledgement MJML email.
 */
export function createContactAcknowledgementTemplateData(
  data: ContactFormData,
  replyToEmail: string
): ContactAcknowledgementTemplateData {
  return {
    greeting: createGreeting(data.name),
    replyToEmail,
  }
}

/*
Template data shape for src/actions/contact/email/message.mjml:

fields: Array<{ label: string; value: string }>
messageHtml: string
attachments: Array<{ filename: string; sizeLabel: string }>
consentGiven: 'Yes' | 'No'
*/
export async function generateEmailContent(
  data: ContactFormData,
  files: FileAttachment[]
): Promise<string> {
  const { html } = await compileEmailTemplate(
    contactMessageTemplate,
    createContactEmailTemplateData(data, files)
  )

  return html
}

/**
 * Generates the acknowledgement email HTML sent back to the contact submitter.
 */
export async function generateAcknowledgementEmailContent(
  data: ContactFormData,
  replyToEmail: string
): Promise<string> {
  const { html } = await compileEmailTemplate(
    contactAcknowledgementTemplate,
    createContactAcknowledgementTemplateData(data, replyToEmail)
  )

  return html
}

export function getFormDataFromInput(input: Record<string, unknown>): ContactFormData {
  const formData: ContactFormData = {
    name: readInputString(input, 'name'),
    email: readInputString(input, 'email'),
    message: readInputString(input, 'message'),
    consent: readInputBoolean(input, 'consent'),
  }

  const company = readInputString(input, 'company')
  const phone = readInputString(input, 'phone')
  const budget = readInputString(input, 'budget')
  const timeline = readInputString(input, 'timeline')
  const website = readInputString(input, 'website')

  // The current Contact form uses `project_type`; map it into `service` for now.
  const projectType = readInputString(input, 'project_type')
  const legacyService = readInputString(input, 'service')
  const service = projectType || legacyService

  const dataSubjectId = readInputString(input, 'DataSubjectId')

  if (company) formData.company = company
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

      const normalizedType = normalizeMimeType(value.type)

      if (!isAllowedAttachmentType(normalizedType)) {
        throw new ActionsFunctionError(`File type ${value.type} not allowed`, { status: 400 })
      }

      const buffer = Buffer.from(await value.arrayBuffer())
      files.push({
        filename: value.name,
        content: buffer,
        contentType: normalizedType,
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

    const normalizedType = normalizeMimeType(value.type)

    if (!isAllowedAttachmentType(normalizedType)) {
      throw new ActionsFunctionError(`File type ${value.type} not allowed`, { status: 400 })
    }

    const buffer = Buffer.from(await value.arrayBuffer())
    files.push({
      filename: value.name,
      content: buffer,
      contentType: normalizedType,
      size: value.size,
    })
  }

  return files
}
