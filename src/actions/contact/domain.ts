import emailValidator from 'email-validator'
import { z } from 'astro/zod'
import {
  requiredString,
  optionalTrimmedString,
  trimString,
  emptyStringToUndefined,
  optionalFile,
  contactTimelineSchema,
  containsSpam,
} from '@actions/contact/utils'

const emailStringError = (issue: { input?: unknown }): string =>
  issue.input === undefined ? 'Email is required' : 'Invalid email format'

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
          error: emailStringError,
        })
        .max(254, { message: 'Email must be less than 254 characters' })
        .superRefine((value, context) => {
          if (!emailValidator.validate(value)) {
            context.addIssue({
              code: 'custom',
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
    website_url: optionalTrimmedString(200),
    budget: z
      .unknown()
      .optional()
      .transform(value => emptyStringToUndefined(trimString(value)))
      .pipe(z.enum(['5k-10k', '10k-25k', '25k-50k', '50k+']).optional()),
    timeline: contactTimelineSchema,

    /** Consent checkbox: value="true" when checked, otherwise missing. */
    consent: z.preprocess(value => (value === 'true' ? true : false), z.boolean()).optional(),

    /** Optional hidden field supported by the action. */
    DataSubjectId: z
      .unknown()
      .optional()
      .transform(value => emptyStringToUndefined(value))
      .pipe(z.uuid().optional()),

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
  .catchall(z.unknown())
  .superRefine((data, context) => {
    const messageContent = `${data.name} ${data.email} ${data.message}`
    if (containsSpam(messageContent)) {
      context.addIssue({
        code: 'custom',
        message: 'Message appears to contain spam',
        path: ['message'],
      })
    }
  })
