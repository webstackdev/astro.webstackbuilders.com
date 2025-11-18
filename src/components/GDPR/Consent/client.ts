/**
 * GDPR Consent Component - Client-side Logic
 *
 * Handles validation and state management for GDPR consent checkboxes in forms
 */
import { recordFormConsent, clearFormConsent } from './state'
import { getConsentCheckbox, getConsentError } from './selectors'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'

/**
 * Initialize GDPR consent checkbox
 *
 * @param checkboxId - ID of the consent checkbox element
 * @param purpose - Data processing purpose
 * @param formId - Optional form identifier
 */
export function initGDPRConsent(
  checkboxId: string,
  purpose: string,
  formId?: string
): void {
  const context = { scriptName: 'GDPRConsent', operation: 'init' }
  addScriptBreadcrumb(context)

  let checkbox: HTMLInputElement
  let errorElement: HTMLDivElement

  // Critical: Must find checkbox and error elements (GDPR legal requirement)
  try {
    checkbox = getConsentCheckbox(checkboxId)
    errorElement = getConsentError(checkboxId)
  } catch (error) {
    throw new ClientScriptError(
      `GDPRConsent: Failed to find required elements for checkbox '${checkboxId}' - ${error instanceof Error ? error.message : 'Unknown error'}. GDPR consent is a legal requirement and cannot function without these elements.`
    )
  }

  // Recoverable: Handle checkbox change events
  try {
    checkbox.addEventListener('change', () => {
      const changeContext = { scriptName: 'GDPRConsent', operation: 'handleChange' }
      addScriptBreadcrumb(changeContext)
      try {
        if (checkbox.checked) {
          recordFormConsent(purpose, formId)
          clearError(errorElement)
        } else {
          clearFormConsent()
        }
      } catch (error) {
        handleScriptError(error, changeContext)
      }
    })
  } catch (error) {
    handleScriptError(error, { scriptName: 'GDPRConsent', operation: 'bindChangeEvent' })
  }

  // Recoverable: Handle form submission validation
  try {
    const form = checkbox.closest('form')
    if (form) {
      form.addEventListener('submit', (event) => {
        const submitContext = { scriptName: 'GDPRConsent', operation: 'handleSubmit' }
        addScriptBreadcrumb(submitContext)
        try {
          if (!validateConsent(checkbox, errorElement)) {
            event.preventDefault()
            checkbox.focus()
          }
        } catch (error) {
          handleScriptError(error, submitContext)
          // Prevent form submission on validation error
          event.preventDefault()
        }
      })
    }
  } catch (error) {
    handleScriptError(error, { scriptName: 'GDPRConsent', operation: 'bindSubmitEvent' })
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
  const context = { scriptName: 'GDPRConsent', operation: 'validateConsent' }
  addScriptBreadcrumb(context)

  try {
    if (!checkbox.checked) {
      showError(
        errorElement,
        'You must consent to data processing to submit this form.'
      )
      return false
    }

    clearError(errorElement)
    return true
  } catch (error) {
    handleScriptError(error, context)
    // On error, assume invalid and show generic error
    try {
      showError(errorElement, 'Unable to validate consent. Please try again.')
    } catch {
      // Silently fail if can't show error
    }
    return false
  }
}

/**
 * Show error message
 *
 * @param errorElement - Error message element
 * @param message - Error message to display
 */
function showError(errorElement: HTMLDivElement, message: string): void {
  const context = { scriptName: 'GDPRConsent', operation: 'showError' }
  addScriptBreadcrumb(context)

  try {
    errorElement.textContent = message
    errorElement.style.display = 'block'
    errorElement.setAttribute('role', 'alert')
  } catch (error) {
    handleScriptError(error, context)
  }
}

/**
 * Clear error message
 *
 * @param errorElement - Error message element
 */
function clearError(errorElement: HTMLDivElement): void {
  const context = { scriptName: 'GDPRConsent', operation: 'clearError' }
  addScriptBreadcrumb(context)

  try {
    errorElement.textContent = ''
    errorElement.style.display = 'none'
    errorElement.removeAttribute('role')
  } catch (error) {
    handleScriptError(error, context)
  }
}

/**
 * Check if consent is currently valid
 *
 * @param checkboxId - ID of the consent checkbox element
 * @returns true if checkbox is checked
 */
export function isConsentValid(checkboxId: string): boolean {
  const context = { scriptName: 'GDPRConsent', operation: 'isConsentValid' }
  addScriptBreadcrumb(context)

  try {
    const checkbox = getConsentCheckbox(checkboxId)
    return checkbox.checked
  } catch (error) {
    handleScriptError(error, context)
    return false
  }
}
