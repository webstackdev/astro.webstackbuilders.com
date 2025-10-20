/**
 * GDPR Form Consent State Management
 *
 * Manages consent state for data collection forms (separate from cookie consent).
 * This tracks explicit user consent for data processing activities like:
 * - Contact form submissions
 * - Newsletter subscriptions
 * - File downloads
 * - Marketing communications
 */
import { atom } from 'nanostores'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Purpose for which data is being collected
 * Must align with purposes listed in Privacy Policy
 */
export type ConsentPurpose =
  | 'contact'      // Processing contact form data to respond to inquiries
  | 'marketing'    // Sending marketing emails and communications
  | 'analytics'    // Website usage analytics
  | 'downloads'    // Providing access to gated content/downloads

/**
 * Form consent state
 * Tracks whether user has explicitly consented to data processing
 */
export interface FormConsentState {
  /** Purposes user has consented to */
  purposes: ConsentPurpose[]

  /** ISO timestamp when consent was given */
  timestamp: string

  /** Whether consent has been validated (checkbox checked) */
  validated: boolean

  /** Optional: Specific form identifier */
  formId?: string
}

// ============================================================================
// STORES
// ============================================================================

/**
 * Form consent state (session-only, not persisted)
 * Null when no consent has been given yet
 */
export const $formConsent = atom<FormConsentState | null>(null)

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Record form consent when checkbox is checked
 *
 * @param purposes - Data processing purposes being consented to
 * @param formId - Optional form identifier
 */
export function recordFormConsent(
  purposes: ConsentPurpose[],
  formId?: string
): void {
  const consentState: FormConsentState = {
    purposes,
    timestamp: new Date().toISOString(),
    validated: true
  }

  if (formId) {
    consentState.formId = formId
  }

  $formConsent.set(consentState)
}

/**
 * Clear form consent (e.g., when checkbox is unchecked)
 */
export function clearFormConsent(): void {
  $formConsent.set(null)
}

/**
 * Check if consent has been given for specific purpose
 *
 * @param purpose - Purpose to check
 * @returns true if user has consented to this purpose
 */
export function hasConsentForPurpose(purpose: ConsentPurpose): boolean {
  const consent = $formConsent.get()
  return consent?.validated && consent.purposes.includes(purpose) || false
}

/**
 * Get current consent state
 *
 * @returns Current form consent state or null
 */
export function getFormConsent(): FormConsentState | null {
  return $formConsent.get()
}
