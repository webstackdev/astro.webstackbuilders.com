import emailValidator from 'email-validator'
import { defineAction } from 'astro:actions'
import { z } from 'astro/zod'

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

export type DownloadsSubmitInput = z.infer<typeof inputSchema>

export const downloads = {
  submit: defineAction({
    accept: 'json',
    input: inputSchema,
    handler: async (input): Promise<{ success: true; message: string }> => {
      console.log('Download form submission:', {
        name: `${input.firstName} ${input.lastName}`,
        email: input.workEmail,
        jobTitle: input.jobTitle,
        company: input.companyName,
        timestamp: new Date().toISOString(),
      })

      return {
        success: true,
        message: 'Form submitted successfully',
      }
    },
  }),
}
