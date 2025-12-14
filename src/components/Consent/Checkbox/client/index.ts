/**
 * GDPR Consent Component - Client-side Logic
 *
 * Handles validation and state management for GDPR consent checkboxes in forms
 */
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { subscribeToFunctionalConsent, updateConsent } from '@components/scripts/store'

const COMPONENT_TAG_NAME = 'consent-checkbox' as const
const READY_EVENT = 'consent-checkbox:ready'
const COMPONENT_SCRIPT_NAME = 'ConsentCheckboxElement'

export class ConsentCheckboxElement extends HTMLElement {
  private domReadyHandler: (() => void) | null = null
  private checkbox: HTMLInputElement | null = null
  private errorElement: HTMLDivElement | null = null
  private form: HTMLFormElement | null = null
  private consentUnsubscribe: (() => void) | null = null
  private changeHandler: (() => void) | null = null
  private submitHandler: ((_event: SubmitEvent) => void) | null = null
  private componentPurpose = ''
  private componentFormId: string | undefined

  public isInitialized = false

  connectedCallback(): void {
    if (typeof document === 'undefined' || this.isInitialized) {
      return
    }

    if (document.readyState === 'loading') {
      this.domReadyHandler = () => {
        this.cleanupDomReadyHandler()
        this.initialize()
      }

      document.addEventListener('DOMContentLoaded', this.domReadyHandler)
      return
    }

    this.initialize()
  }

  disconnectedCallback(): void {
    this.cleanupDomReadyHandler()
    this.cleanupListeners()
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

      if (!checkbox.id) {
        throw new ClientScriptError('Consent checkbox input must include an id attribute')
      }

      const errorElement = this.querySelector<HTMLDivElement>(`#${checkbox.id}-error`)

      if (!errorElement) {
        throw new ClientScriptError('Consent checkbox error element not found inside component')
      }

      this.checkbox = checkbox
      this.errorElement = errorElement
      this.form = checkbox.closest('form')
      this.componentPurpose = this.resolvePurpose()
      this.componentFormId = this.resolveFormId()

      this.subscribeToConsentChanges()
      this.bindCheckboxChange()
      this.bindFormValidation()

      this.isInitialized = true
      this.dispatchReadyEvent()
    } catch (error) {
      handleScriptError(error, context)
      this.cleanupListeners()
      this.isInitialized = false
    }
  }

  private resolvePurpose(): string {
    const dataSource = this.querySelector<HTMLElement>('[data-purpose]')
    return this.getAttribute('data-purpose') ?? dataSource?.dataset['purpose'] ?? ''
  }

  private resolveFormId(): string | undefined {
    const dataSource = this.querySelector<HTMLElement>('[data-form-id]')
    return this.getAttribute('data-form-id') ?? dataSource?.dataset['formId'] ?? undefined
  }

  private buildContext(operation: string) {
    return {
      scriptName: COMPONENT_SCRIPT_NAME,
      operation,
      checkboxId: this.checkbox?.id,
      purpose: this.componentPurpose,
      formId: this.componentFormId,
    }
  }

  private subscribeToConsentChanges(): void {
    if (this.consentUnsubscribe || !this.checkbox) {
      return
    }

    const syncConsentState = (hasConsent: boolean) => {
      if (!this.checkbox) {
        return
      }

      this.checkbox.checked = hasConsent
      if (hasConsent) {
        this.clearError()
      }
    }

    try {
      this.consentUnsubscribe = subscribeToFunctionalConsent(syncConsentState)
    } catch (error) {
      handleScriptError(error, this.buildContext('syncConsentState'))
    }
  }

  private bindCheckboxChange(): void {
    if (!this.checkbox) {
      return
    }

    this.changeHandler = () => {
      const context = this.buildContext('handleChange')
      addScriptBreadcrumb(context)

      try {
        updateConsent('functional', this.checkbox!.checked)
        if (this.checkbox?.checked) {
          this.clearError()
        }
      } catch (error) {
        handleScriptError(error, context)
      }
    }

    try {
      this.checkbox.addEventListener('change', this.changeHandler)
    } catch (error) {
      handleScriptError(error, this.buildContext('bindChangeEvent'))
    }
  }

  private bindFormValidation(): void {
    if (!this.checkbox) {
      return
    }

    this.form = this.checkbox.closest('form')
    if (!this.form) {
      return
    }

    this.submitHandler = (event: SubmitEvent) => {
      const submitContext = this.buildContext('handleSubmit')
      addScriptBreadcrumb(submitContext)

      try {
        if (!this.validateConsent()) {
          event.preventDefault()
          this.checkbox?.focus()
        }
      } catch (error) {
        handleScriptError(error, submitContext)
        event.preventDefault()
      }
    }

    try {
      this.form.addEventListener('submit', this.submitHandler)
    } catch (error) {
      handleScriptError(error, this.buildContext('bindSubmitEvent'))
    }
  }

  private validateConsent(): boolean {
    const context = this.buildContext('validateConsent')
    addScriptBreadcrumb(context)

    try {
      if (!this.checkbox?.checked) {
        this.showError('You must consent to data processing to submit this form.')
        return false
      }

      this.clearError()
      return true
    } catch (error) {
      handleScriptError(error, context)
      this.showError('Unable to validate consent. Please try again.')
      return false
    }
  }

  private showError(message: string): void {
    if (!this.errorElement) {
      return
    }

    const context = this.buildContext('showError')
    addScriptBreadcrumb(context)

    try {
      this.errorElement.textContent = message
      this.errorElement.style.display = 'block'
      this.checkbox?.setAttribute('aria-invalid', 'true')
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private clearError(): void {
    if (!this.errorElement) {
      return
    }

    const context = this.buildContext('clearError')
    addScriptBreadcrumb(context)

    try {
      this.errorElement.textContent = ''
      this.errorElement.style.display = 'none'
      this.checkbox?.setAttribute('aria-invalid', 'false')
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private dispatchReadyEvent(): void {
    this.dispatchEvent(new CustomEvent(READY_EVENT))
  }

  private cleanupDomReadyHandler(): void {
    if (this.domReadyHandler) {
      document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
      this.domReadyHandler = null
    }
  }

  private cleanupListeners(): void {
    if (this.checkbox && this.changeHandler) {
      try {
        this.checkbox.removeEventListener('change', this.changeHandler)
      } catch {
        // Ignore cleanup errors
      }
    }

    if (this.form && this.submitHandler) {
      try {
        this.form.removeEventListener('submit', this.submitHandler)
      } catch {
        // Ignore cleanup errors
      }
    }

    if (this.consentUnsubscribe) {
      try {
        this.consentUnsubscribe()
      } catch {
        // Ignore cleanup errors
      }
    }

    this.checkbox = null
    this.errorElement = null
    this.form = null
    this.changeHandler = null
    this.submitHandler = null
    this.consentUnsubscribe = null
    this.componentPurpose = ''
    this.componentFormId = undefined
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
