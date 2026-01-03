import { z } from 'astro:schema'
import type { ConsentRequest } from '@actions/gdpr/@types'

export const consentCreateSchema = z.custom<ConsentRequest>()
export const consentListSchema = z.object({
  DataSubjectId: z.string().min(1),
  purpose: z.string().optional(),
})
export const consentDeleteSchema = z.object({
  DataSubjectId: z.string().min(1),
})

export const dsarRequestSchema = z.object({
  email: z.string().min(1),
  requestType: z.enum(['ACCESS', 'DELETE']),
})
