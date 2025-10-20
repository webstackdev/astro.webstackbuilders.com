/**
 * GDPR Consent Component - Client-side Logic
 *
 * Handles validation and state management for GDPR consent checkboxes in forms
 */
import { recordFormConsent, clearFormConsent, type ConsentPurpose } from './state'
import { getConsentCheckbox, getConsentError } from './selectors'

/**
 * Initialize GDPR consent checkbox
 *
 * @param checkboxId - ID of the consent checkbox element
 * @param purposes - Data processing purposes
 * @param formId - Optional form identifier
 */
export function initGDPRConsent(
  checkboxId: string,
  purposes: ConsentPurpose[],
  formId?: string
): void {
  try {
    const checkbox = getConsentCheckbox(checkboxId)
    const errorElement = getConsentError(checkboxId)

    // Handle checkbox change
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        recordFormConsent(purposes, formId)
        clearError(errorElement)
      } else {
        clearFormConsent()
      }
    })

    // Handle form submission validation
    const form = checkbox.closest('form')
    if (form) {
      form.addEventListener('submit', (event) => {
        if (!validateConsent(checkbox, errorElement)) {
          event.preventDefault()
          checkbox.focus()
        }
      })
    }
  } catch (error) {
    console.error('Failed to initialize GDPR consent:', error)
  }
}

/**
 * Validate consent checkbox is checked
 *
 * @param checkbox - Checkbox element
 * @param errorElement - Error message element
 * @returns true if valid, false otherwise
 */
export function validateConsent(
  checkbox: HTMLInputElement,
  errorElement: HTMLDivElement
): boolean {
  if (!checkbox.checked) {
    showError(
      errorElement,
      'You must consent to data processing to submit this form.'
    )
    return false
  }

  clearError(errorElement)
  return true
}

/**
 * Show error message
 *
 * @param errorElement - Error message element
 * @param message - Error message to display
 */
function showError(errorElement: HTMLDivElement, message: string): void {
  errorElement.textContent = message
  errorElement.style.display = 'block'
  errorElement.setAttribute('role', 'alert')
}

/**
 * Clear error message
 *
 * @param errorElement - Error message element
 */
function clearError(errorElement: HTMLDivElement): void {
  errorElement.textContent = ''
  errorElement.style.display = 'none'
  errorElement.removeAttribute('role')
}

/**
 * Check if consent is currently valid
 *
 * @param checkboxId - ID of the consent checkbox element
 * @returns true if checkbox is checked
 */
export function isConsentValid(checkboxId: string): boolean {
  try {
    const checkbox = getConsentCheckbox(checkboxId)
    return checkbox.checked
  } catch {
    return false
  }
}
