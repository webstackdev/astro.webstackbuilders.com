import emailValidator from 'email-validator'
import { defineAction } from 'astro:actions'
import { z } from 'astro:schema'

type DownloadFormData = {
  firstName: string
  lastName: string
  workEmail: string
  jobTitle: string
  companyName: string
}

const inputSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  workEmail: z
    .string()
    .trim()
    .min(1)
    .refine(value => emailValidator.validate(value), 'Invalid email address'),
  jobTitle: z.string().trim().min(1),
  companyName: z.string().trim().min(1),
})

export const downloads = {
  submit: defineAction({
    accept: 'json',
    input: inputSchema,
    handler: async (input): Promise<{ success: true; message: string }> => {
      const data = input as DownloadFormData

      console.log('Download form submission:', {
        name: `${data.firstName} ${data.lastName}`,
        email: data.workEmail,
        jobTitle: data.jobTitle,
        company: data.companyName,
        timestamp: new Date().toISOString(),
      })

      return {
        success: true,
        message: 'Form submitted successfully',
      }
    },
  }),
}
