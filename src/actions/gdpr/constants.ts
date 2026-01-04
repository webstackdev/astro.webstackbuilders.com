export const CONSENT_PURPOSES = ['contact', 'marketing', 'analytics', 'functional', 'downloads'] as const

export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number]

export const CONSENT_SOURCES = [
  'contact_form',
  'newsletter_form',
  'download_form',
  'cookies_modal',
  'preferences_page',
] as const

export type ConsentSource = (typeof CONSENT_SOURCES)[number]
