export type ContactFormData = {
  name: string
  email: string
  phone?: string
  message: string
  consent?: boolean
  DataSubjectId?: string
  service?: string
  budget?: string
  timeline?: ContactTimeline
  website?: string
}

export type ContactTimeline =
  | 'asap'
  | '1-month'
  | '2-3-months'
  | '3-6-months'
  | '6-months-plus'
  | 'flexible'

export type FileAttachment = {
  filename: string
  content: Buffer
  contentType: string
  size: number
}

export type EmailData = {
  from: string
  to: string
  subject: string
  html: string
}

interface RequiredStringOptions {
  required_error: string
  invalid_type_error: string
  min: { value: number; message: string }
  max: { value: number; message: string }
}
