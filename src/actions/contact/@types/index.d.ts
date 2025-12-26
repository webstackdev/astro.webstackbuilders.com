export type ContactFormData = {
  name: string
  email: string
  phone?: string
  message: string
  consent?: boolean
  DataSubjectId?: string
  service?: string
  budget?: string
  timeline?: string
  website?: string
}

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
