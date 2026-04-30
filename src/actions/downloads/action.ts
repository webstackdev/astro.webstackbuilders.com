import emailValidator from 'email-validator'
import { defineAction } from 'astro:actions'
import { z } from 'astro/zod'
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
import { createConsentRecord } from '@actions/gdpr/entities/consent'
import { getPrivacyPolicyVersion } from '@actions/utils/environment/environmentActions'
import { handleActionsFunctionError } from '@actions/utils/errors'
import { createOrUpdateContact, setMarketingOptIn } from '@actions/utils/hubspot'

const optionalTrimmedString = z.string().optional().transform(value => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : undefined
})

export const inputSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  workEmail: z
    .string()
    .trim()
    .min(1)
    .refine(value => emailValidator.validate(value), 'Invalid email address'),
  jobTitle: optionalTrimmedString,
  companyName: optionalTrimmedString,
  consent: z.boolean().optional(),
  DataSubjectId: z.uuid().optional(),
})

export type DownloadsSubmitInput = z.infer<typeof inputSchema>

export const downloads = {
  submit: defineAction({
    accept: 'json',
    input: inputSchema,
    handler: async (input, context): Promise<{ success: true; message: string }> => {
      if (input.consent) {
        let subjectId = input.DataSubjectId
        if (!subjectId) {
          subjectId = uuidv4()
        } else if (!uuidValidate(subjectId)) {
          throw new Error('Invalid DataSubjectId format')
        }

        const userAgent = context.request.headers.get('user-agent') || 'unknown'
        const ip =
          context.clientAddress ||
          context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          context.request.headers.get('x-real-ip') ||
          'unknown'

        await createConsentRecord({
          dataSubjectId: subjectId,
          email: input.workEmail.trim(),
          purposes: ['downloads'],
          source: 'download_form',
          userAgent,
          ipAddress: ip !== 'unknown' ? ip : null,
          privacyPolicyVersion: getPrivacyPolicyVersion(),
          consentText:
            'I consent to Webstack Builders processing my personal data for providing your requested download. See our Privacy Policy and Cookie Policy.',
          verified: true,
        })
      }

      console.log('Download form submission:', {
        name: `${input.firstName} ${input.lastName}`,
        email: input.workEmail,
        jobTitle: input.jobTitle ?? null,
        company: input.companyName ?? null,
        timestamp: new Date().toISOString(),
      })

      try {
        const contact = await createOrUpdateContact({
          email: input.workEmail.trim(),
          firstname: input.firstName.trim(),
          lastname: input.lastName.trim(),
        })
        if (input.consent) {
          await setMarketingOptIn(contact.id, true)
        }
      } catch (hubspotError) {
        handleActionsFunctionError(hubspotError, {
          route: '/_actions/downloads/submit',
          operation: 'hubspotCreateContact',
        })
      }

      return {
        success: true,
        message: 'Form submitted successfully',
      }
    },
  }),
}
