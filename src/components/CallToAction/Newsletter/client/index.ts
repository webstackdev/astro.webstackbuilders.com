/**
 * Newsletter Form Web Component (Lit-based)
 * Manages newsletter subscription form with validation and submission
 * Works seamlessly with Astro View Transitions
 */

import { LitElement } from 'lit'
import emailValidator from 'email-validator'
import { actions } from 'astro:actions'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { getNewsletterElements } from './selectors'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

/**
 * Newsletter Form Custom Element (Lit-based)
 * Uses Light DOM (no Shadow DOM) with Astro-rendered templates
 */
export class NewsletterFormElement extends LitElement {
  static readonly registeredName = 'newsletter-form'
  // Render to Light DOM instead of Shadow DOM
  override createRenderRoot() {
    return this // No shadow DOM - works with Astro templates!
  }

  // DOM elements
  private form!: HTMLFormElement
  private emailInput!: HTMLInputElement
  private consentCheckbox!: HTMLInputElement
  private submitButton!: HTMLButtonElement
  private buttonText!: HTMLSpanElement
  private buttonArrow!: SVGSVGElement
  private buttonSpinner!: SVGSVGElement
  private message!: HTMLParagraphElement
  private originalButtonText = 'Subscribe'

  // Track initialization
  private isInitialized = false

  /**
   * Lit lifecycle: called when element is connected
   */
  override connectedCallback(): void {
    super.connectedCallback()
    const context = { scriptName: 'NewsletterFormElement', operation: 'connectedCallback' }
    addScriptBreadcrumb(context)

    const scheduleInitialization = () => {
      queueMicrotask(() => this.initialize())
    }

    if (document.readyState === 'loading') {
      const handleDomReady = () => {
        document.removeEventListener('DOMContentLoaded', handleDomReady)
        scheduleInitialization()
      }
      document.addEventListener('DOMContentLoaded', handleDomReady)
    } else {
      scheduleInitialization()
    }
  }

  /**
   * Initialize the newsletter form after DOM is ready
   * Public for testing purposes
   */
  public initialize(): void {
    const context = { scriptName: 'NewsletterFormElement', operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      // Skip if already initialized (for View Transitions)
      if (this.isInitialized) {
        return
      }

      this.findElements()
      this.bindEvents()
      this.isInitialized = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Find and cache DOM elements
   */
  private findElements(): void {
    const context = { scriptName: 'NewsletterFormElement', operation: 'findElements' }
    addScriptBreadcrumb(context)

    try {
      const elements = getNewsletterElements(this)
      this.form = elements.form
      this.emailInput = elements.emailInput
      this.consentCheckbox = elements.consentCheckbox
      this.submitButton = elements.submitButton
      this.buttonText = elements.buttonText
      this.buttonArrow = elements.buttonArrow
      this.buttonSpinner = elements.buttonSpinner
      this.message = elements.message

      // Save original button text
      this.originalButtonText = this.buttonText.textContent || 'Subscribe'
      this.submitButton.setAttribute('data-original-text', this.originalButtonText)
      this.submitButton.dataset['e2eState'] = 'idle'
    } catch (error) {
      if (error instanceof ClientScriptError) {
        throw error
      }
      throw new ClientScriptError(
        `NewsletterFormElement: Failed to find elements - ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Validate email address format
   */
  private validateEmail(email: string): boolean {
    const context = { scriptName: 'NewsletterFormElement', operation: 'validateEmail' }
    addScriptBreadcrumb(context)

    try {
      return emailValidator.validate(email)
    } catch (error) {
      handleScriptError(error, context)
      return false
    }
  }

  /**
   * Display a message to the user
   */
  private showMessage(text: string, type: 'success' | 'error' | 'info'): void {
    const context = { scriptName: 'NewsletterFormElement', operation: 'showMessage' }
    addScriptBreadcrumb(context)

    try {
      if (!this.message) return

      if (type === 'error') {
        this.message.setAttribute('role', 'alert')
        this.message.setAttribute('aria-live', 'assertive')
      } else {
        this.message.setAttribute('role', 'status')
        this.message.setAttribute('aria-live', 'polite')
      }

      this.message.textContent = text
      this.message.classList.remove(
        'text-[var(--color-text-offset)]',
        'text-[var(--color-success)]',
        'text-[var(--color-danger)]'
      )

      if (type === 'success') {
        this.message.classList.add('text-[var(--color-success)]')
      } else if (type === 'error') {
        this.message.classList.add('text-[var(--color-danger)]')
      } else {
        this.message.classList.add('text-[var(--color-text-offset)]')
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Toggle aria-invalid on form inputs
   */
  private setFieldInvalid(field: HTMLInputElement, invalid: boolean): void {
    if (invalid) {
      field.setAttribute('aria-invalid', 'true')
      return
    }

    field.removeAttribute('aria-invalid')
  }

  /**
   * Set the loading state of the submit button
   */
  private setLoading(loading: boolean): void {
    const context = { scriptName: 'NewsletterFormElement', operation: 'setLoading' }
    addScriptBreadcrumb(context)

    try {
      if (!this.submitButton || !this.buttonText || !this.buttonArrow || !this.buttonSpinner) return

      const state = loading ? 'loading' : 'idle'

      this.submitButton.disabled = loading
      this.submitButton.dataset['e2eState'] = state
      this.submitButton.setAttribute('data-e2e-state', state)
      this.submitButton.setAttribute('aria-busy', loading ? 'true' : 'false')

      if (loading) {
        this.buttonText.textContent = 'Subscribing...'
        this.buttonArrow.classList.add('hidden')
        this.buttonSpinner.classList.remove('hidden')
        this.buttonSpinner.classList.add('inline-block')
      } else {
        this.buttonText.textContent = this.originalButtonText
        this.buttonArrow.classList.remove('hidden')
        this.buttonSpinner.classList.add('hidden')
        this.buttonSpinner.classList.remove('inline-block')
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Handle form submission
   */
  private handleSubmit = async (e: Event): Promise<void> => {
    const context = { scriptName: 'NewsletterFormElement', operation: 'handleSubmit' }
    addScriptBreadcrumb(context)

    try {
      e.preventDefault()

      if (!this.emailInput || !this.consentCheckbox) return

      this.setFieldInvalid(this.emailInput, false)
      this.setFieldInvalid(this.consentCheckbox, false)

      const email = this.emailInput.value.trim()
      const consentGiven = this.consentCheckbox.checked

      // Client-side validation
      if (!email) {
        this.showMessage('Please enter your email address.', 'error')
        this.setFieldInvalid(this.emailInput, true)
        this.emailInput.focus()
        return
      }

      if (!this.validateEmail(email)) {
        this.showMessage('Please enter a valid email address.', 'error')
        this.setFieldInvalid(this.emailInput, true)
        this.emailInput.focus()
        return
      }

      if (!consentGiven) {
        this.showMessage('Please consent to receive marketing communications.', 'error')
        this.setFieldInvalid(this.consentCheckbox, true)
        this.consentCheckbox.focus()
        return
      }

      // Submit to API
      this.setLoading(true)
      this.showMessage('Sending confirmation email...', 'info')

      try {
        const result = await actions.newsletter.subscribe({
          email,
          consentGiven,
        })

        if (result.data?.success) {
          this.showMessage(
            result.data.message || 'Check your email! Click the confirmation link to complete your subscription.',
            'success'
          )
          this.submitButton.dispatchEvent(new CustomEvent('confetti:fire', { bubbles: true, composed: true }))
          this.form?.reset()
          this.setFieldInvalid(this.emailInput, false)
          this.setFieldInvalid(this.consentCheckbox, false)
        } else {
          this.showMessage(result.error?.message || 'Failed to subscribe. Please try again.', 'error')
        }
      } catch (error) {
        handleScriptError(error, { scriptName: 'NewsletterFormElement', operation: 'apiSubmission' })
        this.showMessage('Network error. Please check your connection and try again.', 'error')
      } finally {
        this.setLoading(false)
      }
    } catch (error) {
      handleScriptError(error, context)
      this.showMessage('An error occurred. Please try again.', 'error')
      this.setLoading(false)
    }
  }

  /**
   * Handle email input blur for real-time validation
   */
  private handleEmailBlur = (): void => {
    const context = { scriptName: 'NewsletterFormElement', operation: 'handleEmailBlur' }
    addScriptBreadcrumb(context)

    try {
      if (!this.emailInput) return

      const email = this.emailInput.value.trim()

      if (email && !this.validateEmail(email)) {
        this.setFieldInvalid(this.emailInput, true)
        this.showMessage('Please enter a valid email address.', 'error')
      } else if (email) {
        this.setFieldInvalid(this.emailInput, false)
        this.showMessage("You'll receive a confirmation email. Click the link to complete your subscription.", 'info')
      } else {
        this.setFieldInvalid(this.emailInput, false)
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    const context = { scriptName: 'NewsletterFormElement', operation: 'bindEvents' }
    addScriptBreadcrumb(context)

    try {
      if (!this.form || !this.emailInput) {
        console.warn('Newsletter form: Cannot bind events - required elements not found')
        return
      }

      this.form.addEventListener('submit', this.handleSubmit)
      this.emailInput.addEventListener('blur', this.handleEmailBlur)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Lit lifecycle: called when element is disconnected
   */
  override disconnectedCallback(): void {
    super.disconnectedCallback()
    const context = { scriptName: 'NewsletterFormElement', operation: 'disconnectedCallback' }
    addScriptBreadcrumb(context)

    try {
      // Clean up event listeners
      if (this.form) {
        this.form.removeEventListener('submit', this.handleSubmit)
      }
      if (this.emailInput) {
        this.emailInput.removeEventListener('blur', this.handleEmailBlur)
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }
}

export const registerNewsletterFormWebComponent = (tagName = NewsletterFormElement.registeredName) =>
  defineCustomElement(tagName, NewsletterFormElement)

export const webComponentModule: WebComponentModule<NewsletterFormElement> = {
  registeredName: NewsletterFormElement.registeredName,
  componentCtor: NewsletterFormElement,
  registerWebComponent: registerNewsletterFormWebComponent,
}

