export interface ConsentRecord {
  id: string
  DataSubjectId: string
  email?: string
  purposes: Array<'contact' | 'marketing' | 'analytics' | 'downloads'>
  timestamp: string
  source: 'contact_form' | 'newsletter_form' | 'download_form' | 'cookies_modal' | 'preferences_page'
  userAgent: string
  ipAddress?: string
  privacyPolicyVersion: string
  consentText?: string
  verified: boolean
}

export interface ConsentRequest {
  DataSubjectId: string
  email?: string
  purposes: Array<'contact' | 'marketing' | 'analytics' | 'downloads'>
  source: string
  userAgent: string
  ipAddress?: string
  consentText?: string
  verified?: boolean
}

export interface ConsentResponse {
  success: true
  record: ConsentRecord
}

export interface ErrorResponse {
  success: false
  error: {
    code: 'INVALID_UUID' | 'RATE_LIMIT_EXCEEDED' | 'NOT_FOUND' | 'UNAUTHORIZED'
    message: string
  }
}
