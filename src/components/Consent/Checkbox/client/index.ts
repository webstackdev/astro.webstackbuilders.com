/**
 * GDPR Consent Component - Client-side Logic
 *
 * Handles validation and state management for GDPR consent checkboxes in forms
 */
import { getConsentCheckbox, getConsentError } from './selectors'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { subscribeToFunctionalConsent, updateConsent } from '@components/scripts/store'

const COMPONENT_TAG_NAME = 'consent-checkbox' as const
const READY_EVENT = 'consent-checkbox:ready'
const COMPONENT_SCRIPT_NAME = 'ConsentCheckboxElement'

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
): () => void {
  const contextMetadata = { checkboxId, purpose, formId }
  const context = { scriptName: 'GDPRConsent', operation: 'init', ...contextMetadata }
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

  const syncConsentState = (hasConsent: boolean) => {
    checkbox.checked = hasConsent
    if (hasConsent) {
      clearError(errorElement)
    }
  }

  let consentUnsubscribe: (() => void) | null = null
  try {
    consentUnsubscribe = subscribeToFunctionalConsent(syncConsentState)
  } catch (error) {
    handleScriptError(error, {
      scriptName: 'GDPRConsent',
      operation: 'syncConsentState',
      ...contextMetadata,
    })
  }

  const changeHandler = () => {
    const changeContext = { scriptName: 'GDPRConsent', operation: 'handleChange', ...contextMetadata }
    addScriptBreadcrumb(changeContext)

    try {
      updateConsent('functional', checkbox.checked)
      if (checkbox.checked) {
        clearError(errorElement)
      }
    } catch (error) {
      handleScriptError(error, changeContext)
    }
  }

  // Recoverable: Handle checkbox change events
  try {
    checkbox.addEventListener('change', changeHandler)
  } catch (error) {
    handleScriptError(error, { scriptName: 'GDPRConsent', operation: 'bindChangeEvent', ...contextMetadata })
  }

  let form: HTMLFormElement | null = null
  let submitHandler: ((_event: SubmitEvent) => void) | null = null

  // Recoverable: Handle form submission validation
  try {
    form = checkbox.closest('form')
    if (form) {
      submitHandler = (event) => {
        const submitContext = { scriptName: 'GDPRConsent', operation: 'handleSubmit', ...contextMetadata }
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
      }

      form.addEventListener('submit', submitHandler)
    }
  } catch (error) {
    handleScriptError(error, { scriptName: 'GDPRConsent', operation: 'bindSubmitEvent', ...contextMetadata })
  }

  return () => {
    try {
      checkbox.removeEventListener('change', changeHandler)
    } catch {
      // Ignore cleanup errors
    }

    if (form && submitHandler) {
      try {
        form.removeEventListener('submit', submitHandler)
      } catch {
        // Ignore cleanup errors
      }
    }

    try {
      consentUnsubscribe?.()
    } catch {
      // Ignore cleanup errors
    }
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

export class ConsentCheckboxElement extends HTMLElement {
  private domReadyHandler: (() => void) | null = null
  private teardownHandlers: (() => void) | null = null
  public isInitialized = false

  connectedCallback(): void {
    if (this.isInitialized) {
      return
    }

    if (document.readyState === 'loading') {
      this.domReadyHandler = () => {
        if (this.domReadyHandler) {
          document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
          this.domReadyHandler = null
        }
        this.initialize()
      }

      document.addEventListener('DOMContentLoaded', this.domReadyHandler)
      return
    }

    this.initialize()
  }

  disconnectedCallback(): void {
    if (this.domReadyHandler) {
      document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
      this.domReadyHandler = null
    }

    if (this.teardownHandlers) {
      this.teardownHandlers()
      this.teardownHandlers = null
    }

    this.isInitialized = false
  }

  private initialize(): void {
    if (this.isInitialized) {
      return
    }

    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      const checkbox = this.querySelector<HTMLInputElement>('input[type="checkbox"]')

      if (!checkbox) {
        throw new ClientScriptError('Consent checkbox input not found inside component')
      }

      const dataSource = this.querySelector<HTMLElement>('[data-purpose]')
      const purpose = this.getAttribute('data-purpose') ?? dataSource?.dataset['purpose'] ?? ''
      const formId = this.getAttribute('data-form-id') ?? dataSource?.dataset['formId'] ?? undefined

      if (this.teardownHandlers) {
        this.teardownHandlers()
        this.teardownHandlers = null
      }

      this.teardownHandlers = initGDPRConsent(checkbox.id, purpose, formId)

      this.isInitialized = true
      this.dispatchEvent(new CustomEvent(READY_EVENT))
    } catch (error) {
      handleScriptError(error, context)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'consent-checkbox': ConsentCheckboxElement
  }
}

export const registerConsentCheckboxWebComponent = (tagName: string = COMPONENT_TAG_NAME) => {
  if (typeof window === 'undefined') return
  defineCustomElement(tagName, ConsentCheckboxElement)
}

export const webComponentModule: WebComponentModule<ConsentCheckboxElement> = {
  registeredName: COMPONENT_TAG_NAME,
  componentCtor: ConsentCheckboxElement,
  registerWebComponent: registerConsentCheckboxWebComponent,
}
