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
 * Form consent state
 * Tracks whether user has explicitly consented to data processing
 */
export interface FormConsentState {
  /** Purpose user has consented to */
  purpose: string

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
 * @param purpose - Data processing purpose being consented to
 * @param formId - Optional form identifier
 */
export function recordFormConsent(
  purpose: string,
  formId?: string
): void {
  const consentState: FormConsentState = {
    purpose,
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
export function hasConsentForPurpose(purpose: string): boolean {
  const consent = $formConsent.get()
  return consent?.validated && consent.purpose === purpose || false
}

/**
 * Get current consent state
 *
 * @returns Current form consent state or null
 */
export function getFormConsent(): FormConsentState | null {
  return $formConsent.get()
}
