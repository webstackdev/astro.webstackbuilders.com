export type NewsletterFormData = {
  email: string
  firstName?: string
  consentGiven?: boolean
  DataSubjectId?: string
}

export type ConvertKitSubscriber = {
  email_address: string
  first_name?: string
  state?: 'active' | 'inactive'
  fields?: Record<string, string>
}

export type ConvertKitResponse = {
  subscriber: {
    id: number
    first_name: string | null
    email_address: string
    state: string
    created_at: string
    fields: Record<string, string>
  }
}

export type ConvertKitErrorResponse = {
  errors: string[]
}

export interface PendingSubscription {
  email: string
  firstName?: string | undefined
  DataSubjectId: string
  token: string
  createdAt: string
  expiresAt: string
  consentTimestamp: string
  userAgent: string
  ipAddress?: string | undefined
  verified: boolean
  source: 'newsletter_form' | 'contact_form'
}

export type NewsletterSubscribeInput = {
  email: string
  firstName?: string
  consentGiven?: boolean
  DataSubjectId?: string
}

export type NewsletterSubscribeOutput = { success: true; message: string; requiresConfirmation: true }

export type NewsletterConfirmInput = { token: string }

export type NewsletterConfirmOutput = {
  success: boolean
  status: 'success' | 'expired'
  email?: string
  message: string
}

export type ActionConfig<Input, Output> = {
  handler: (_input: Input, _context: unknown) => Promise<Output>
  input?: unknown
}
