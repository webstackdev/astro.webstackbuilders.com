import {
  CONSENT_PURPOSES,
  type ConsentPurpose,
  CONSENT_SOURCES,
  type ConsentSource,
} from './constants'

export const DEFAULT_SOURCE: ConsentSource = 'cookies_modal'
export const DEFAULT_USER_AGENT = 'unknown'

export const isConsentPurpose = (value: unknown): value is ConsentPurpose =>
  typeof value === 'string' && CONSENT_PURPOSES.includes(value as ConsentPurpose)

export const isConsentSource = (value: unknown): value is ConsentSource =>
  typeof value === 'string' && CONSENT_SOURCES.includes(value as ConsentSource)

export const sanitizePurposes = (purposes: unknown): ConsentPurpose[] =>
  Array.isArray(purposes) ? purposes.filter(isConsentPurpose) : []

export const sanitizeSource = (source: unknown): ConsentSource =>
  isConsentSource(source) ? source : DEFAULT_SOURCE

export const normalizeNullableString = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const normalizeUserAgent = (value?: string | null): string =>
  normalizeNullableString(value) ?? DEFAULT_USER_AGENT
