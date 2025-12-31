import emailValidator from 'email-validator'
import { z } from 'astro/zod'
import type { ContactTimeline } from '@actions/contact/@types'
import { isAllowedTimeline } from './responder'

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

interface RequiredStringOptions {
  required_error: string
  invalid_type_error: string
  min: { value: number; message: string }
  max: { value: number; message: string }
}

const requiredString = (options: RequiredStringOptions) => {
  return z.preprocess(
    emptyStringToUndefined,
    z
      .string({
        required_error: options.required_error,
        invalid_type_error: options.invalid_type_error,
      })
      .min(options.min.value, { message: options.min.message })
      .max(options.max.value, { message: options.max.message })
  )
}

const isFile = (value: unknown): value is File => typeof File !== 'undefined' && value instanceof File
const optionalFile = () => z.custom<File>(isFile).optional()

const contactTimelineSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .custom<ContactTimeline>(
      (value): value is ContactTimeline => typeof value === 'string' && isAllowedTimeline(value),
      { message: 'Invalid project timeline' }
    )
    .optional()
)

const spamPatterns = ['viagra', 'cialis', 'casino', 'poker', 'lottery']

const containsSpam = (text: string): boolean => {
  const normalized = text.toLowerCase()
  return spamPatterns.some(pattern => normalized.includes(pattern))
}

export const contactFormInputSchema = z
  .object({
    /** Core fields used by the action. */
    name: requiredString({
      required_error: 'Name is required',
      invalid_type_error: 'Invalid name format',
      min: { value: 2, message: 'Name must be at least 2 characters' },
      max: { value: 100, message: 'Name must be less than 100 characters' },
    }),
    email: z.preprocess(
      emptyStringToUndefined,
      z
        .string({
          required_error: 'Email is required',
          invalid_type_error: 'Invalid email format',
        })
        .max(254, { message: 'Email must be less than 254 characters' })
        .superRefine((value, context) => {
          if (!emailValidator.validate(value)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Invalid email address',
            })
          }
        })
    ),
    message: requiredString({
      required_error: 'Message is required',
      invalid_type_error: 'Invalid message format',
      min: { value: 10, message: 'Message must be at least 10 characters' },
      max: { value: 2000, message: 'Message must be less than 2000 characters' },
    }),

    /** Extra fields submitted by the form UI. */
    company: optionalTrimmedString(100),
    phone: optionalTrimmedString(50),
    project_type: optionalTrimmedString(50),
    budget: z.preprocess(trimString, z.enum(['5k-10k', '10k-25k', '25k-50k', '50k+'])),
    timeline: contactTimelineSchema,

    /** Consent checkbox: value="true" when checked, otherwise missing. */
    consent: z.preprocess(value => (value === 'true' ? true : false), z.boolean()).optional(),

    /** Optional hidden field supported by the action. */
    DataSubjectId: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),

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
  .superRefine((data, context) => {
    const messageContent = `${data.name} ${data.email} ${data.message}`
    if (containsSpam(messageContent)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Message appears to contain spam',
        path: ['message'],
      })
    }
  })
