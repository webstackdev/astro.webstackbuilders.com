/**
 * GDPR Consent Component - Client-side Logic
 *
 * Handles validation and state management for GDPR consent checkboxes in forms
 */
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  getConsentSnapshot,
  subscribeToFunctionalConsent,
  updateConsent,
} from '@components/scripts/store'
import {
  getConsentCheckboxErrorElement,
  getConsentCheckboxInput,
  queryConsentCheckboxContainer,
  queryConsentCheckboxDataSubjectIdInput,
  queryConsentCheckboxHiddenConsentInput,
  queryConsentCheckboxFormIdData,
  queryConsentCheckboxPurposeData,
} from './selectors'

const COMPONENT_TAG_NAME = 'consent-checkbox' as const
const READY_EVENT = 'consent-checkbox:ready'
const COMPONENT_SCRIPT_NAME = 'ConsentCheckboxElement'

export class ConsentCheckboxElement extends HTMLElement {
  private domReadyHandler: (() => void) | null = null
  private checkbox: HTMLInputElement | null = null
  private container: HTMLDivElement | null = null
  private hiddenConsentInput: HTMLInputElement | null = null
  private dataSubjectIdInput: HTMLInputElement | null = null
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
      const checkbox = getConsentCheckboxInput(this)

      if (!checkbox.id) {
        throw new ClientScriptError('Consent checkbox input must include an id attribute')
      }

      const errorElement = getConsentCheckboxErrorElement(this, checkbox.id)

      this.container = queryConsentCheckboxContainer(this, checkbox.id)
      this.hiddenConsentInput = queryConsentCheckboxHiddenConsentInput(this, checkbox.id)
      this.dataSubjectIdInput = queryConsentCheckboxDataSubjectIdInput(this, checkbox.id)

      this.checkbox = checkbox
      this.errorElement = errorElement
      this.form = checkbox.closest('form')
      this.componentPurpose = this.resolvePurpose()
      this.componentFormId = this.resolveFormId()

      this.seedDataSubjectId()

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
    return this.getAttribute('data-purpose') ?? queryConsentCheckboxPurposeData(this) ?? ''
  }

  private resolveFormId(): string | undefined {
    return this.getAttribute('data-form-id') ?? queryConsentCheckboxFormIdData(this) ?? undefined
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
      this.applyConsentUIState(hasConsent)
    }

    try {
      this.consentUnsubscribe = subscribeToFunctionalConsent(syncConsentState)
    } catch (error) {
      handleScriptError(error, this.buildContext('syncConsentState'))
    }
  }

  private seedDataSubjectId(): void {
    if (!this.dataSubjectIdInput) {
      return
    }

    const context = this.buildContext('seedDataSubjectId')
    addScriptBreadcrumb(context)

    try {
      const snapshot = getConsentSnapshot()
      const value = typeof snapshot.DataSubjectId === 'string' ? snapshot.DataSubjectId.trim() : ''
      if (!value) {
        return
      }

      this.dataSubjectIdInput.value = value
      this.dataSubjectIdInput.disabled = false
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private applyConsentUIState(hasConsent: boolean): void {
    if (!this.checkbox) {
      return
    }

    this.checkbox.checked = hasConsent
    this.checkbox.disabled = hasConsent

    if (this.container) {
      this.container.style.display = hasConsent ? 'none' : ''
    }

    if (this.hiddenConsentInput) {
      this.hiddenConsentInput.disabled = !hasConsent
    }

    if (hasConsent) {
      this.clearError()
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
          event.stopImmediatePropagation()
          event.stopPropagation()
          this.checkbox?.focus()
        }
      } catch (error) {
        handleScriptError(error, submitContext)
        event.preventDefault()
        event.stopImmediatePropagation()
        event.stopPropagation()
      }
    }

    try {
      // Capture-phase ensures consent validation runs before other submit handlers
      // registered in the bubble phase (e.g. form submission logic).
      this.form.addEventListener('submit', this.submitHandler, true)
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
        this.form.removeEventListener('submit', this.submitHandler, true)
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
    this.container = null
    this.hiddenConsentInput = null
    this.dataSubjectIdInput = null
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
