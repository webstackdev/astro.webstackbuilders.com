/**
 * Newsletter subscription form client-side logic
 * Manages form validation, submission, and UI state changes
 */

import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'
import { handleScriptError, addScriptBreadcrumb } from '@components/scripts/errors'

/**
 * Newsletter form component with instance-specific approach
 */
export class NewsletterForm {
  static scriptName = 'NewsletterForm'

  // Email validation pattern (matches server-side)
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // DOM elements
  private form: HTMLFormElement | null = null
  private emailInput: HTMLInputElement | null = null
  private consentCheckbox: HTMLInputElement | null = null
  private submitButton: HTMLButtonElement | null = null
  private buttonText: HTMLSpanElement | null = null
  private buttonArrow: SVGSVGElement | null = null
  private buttonSpinner: SVGSVGElement | null = null
  private message: HTMLParagraphElement | null = null
  private originalButtonText = 'Subscribe'

  constructor() {
    this.initializeElements()
  }

  /**
   * Initialize DOM element references
   */
  private initializeElements(): void {
    const context = { scriptName: NewsletterForm.scriptName, operation: 'initializeElements' }
    addScriptBreadcrumb(context)

    try {
      this.form = document.getElementById('newsletter-form') as HTMLFormElement | null
      this.emailInput = document.getElementById('newsletter-email') as HTMLInputElement | null
      this.consentCheckbox = document.getElementById('newsletter-gdpr-consent') as HTMLInputElement | null
      this.submitButton = document.getElementById('newsletter-submit') as HTMLButtonElement | null
      this.buttonText = document.getElementById('button-text') as HTMLSpanElement | null
      this.buttonArrow = document.getElementById('button-arrow') as SVGSVGElement | null
      this.buttonSpinner = document.getElementById('button-spinner') as SVGSVGElement | null
      this.message = document.getElementById('newsletter-message') as HTMLParagraphElement | null

      if (
        !this.form ||
        !this.emailInput ||
        !this.consentCheckbox ||
        !this.submitButton ||
        !this.buttonText ||
        !this.buttonArrow ||
        !this.buttonSpinner ||
        !this.message
      ) {
        throw new ClientScriptError(
          'NewsletterForm: Required DOM elements not found. Form requires all elements to function.'
        )
      }

      // Save original button text (recoverable)
      try {
        this.originalButtonText = this.buttonText.textContent || 'Subscribe'
        this.submitButton.setAttribute('data-original-text', this.originalButtonText)
      } catch (error) {
        handleScriptError(error, { scriptName: NewsletterForm.scriptName, operation: 'saveButtonText' })
      }
    } catch (error) {
      if (error instanceof ClientScriptError) {
        throw error
      }
      throw new ClientScriptError(
        `NewsletterForm: Failed to initialize elements - ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Validate email address format
   */
  public validateEmail(email: string): boolean {
    const context = { scriptName: NewsletterForm.scriptName, operation: 'validateEmail' }
    addScriptBreadcrumb(context)

    try {
      return this.emailRegex.test(email)
    } catch (error) {
      handleScriptError(error, context)
      return false
    }
  }

  /**
   * Display a message to the user
   */
  public showMessage(text: string, type: 'success' | 'error' | 'info'): void {
    const context = { scriptName: NewsletterForm.scriptName, operation: 'showMessage' }
    addScriptBreadcrumb(context)

    try {
      if (!this.message) return

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
   * Set the loading state of the submit button
   */
  public setLoading(loading: boolean): void {
    const context = { scriptName: NewsletterForm.scriptName, operation: 'setLoading' }
    addScriptBreadcrumb(context)

    try {
      if (!this.submitButton || !this.buttonText || !this.buttonArrow || !this.buttonSpinner) return

      this.submitButton.disabled = loading

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
    const context = { scriptName: NewsletterForm.scriptName, operation: 'handleSubmit' }
    addScriptBreadcrumb(context)

    try {
      e.preventDefault()

      if (!this.emailInput || !this.consentCheckbox) return

      const email = this.emailInput.value.trim()
      const consentGiven = this.consentCheckbox.checked

      // Client-side validation
      if (!email) {
        this.showMessage('Please enter your email address.', 'error')
        this.emailInput.focus()
        return
      }

      if (!this.validateEmail(email)) {
        this.showMessage('Please enter a valid email address.', 'error')
        this.emailInput.focus()
        return
      }

      if (!consentGiven) {
        this.showMessage('Please consent to receive marketing communications.', 'error')
        this.consentCheckbox.focus()
        return
      }

      // Submit to API
      this.setLoading(true)
      this.showMessage('Sending confirmation email...', 'info')

      try {
        const response = await fetch('/api/newsletter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            consentGiven
          }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          this.showMessage(
            data.message || 'Check your email! Click the confirmation link to complete your subscription.',
            'success'
          )
          this.form?.reset()
        } else {
          this.showMessage(data.error || 'Failed to subscribe. Please try again.', 'error')
        }
      } catch (error) {
        handleScriptError(error, { scriptName: NewsletterForm.scriptName, operation: 'apiSubmission' })
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
    const context = { scriptName: NewsletterForm.scriptName, operation: 'handleEmailBlur' }
    addScriptBreadcrumb(context)

    try {
      if (!this.emailInput) return

      const email = this.emailInput.value.trim()

      if (email && !this.validateEmail(email)) {
        this.showMessage('Please enter a valid email address.', 'error')
      } else if (email) {
        this.showMessage("You'll receive a confirmation email. Click the link to complete your subscription.", 'info')
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents(): void {
    const context = { scriptName: NewsletterForm.scriptName, operation: 'bindEvents' }
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
   * Remove event listeners for cleanup
   */
  unbindEvents(): void {
    const context = { scriptName: NewsletterForm.scriptName, operation: 'unbindEvents' }
    addScriptBreadcrumb(context)

    try {
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

  /**
   * LoadableScript static methods
   */
  static init(): void {
    const context = { scriptName: NewsletterForm.scriptName, operation: 'init' }
    addScriptBreadcrumb(context)

    try {
      const newsletterForm = new NewsletterForm()
      newsletterForm.bindEvents()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  static pause(): void {
    // Newsletter form doesn't need pause functionality during visibility changes
  }

  static resume(): void {
    // Newsletter form doesn't need resume functionality during visibility changes
  }

  static reset(): void {
    // Clean up any global state if needed for View Transitions
    // This could be enhanced to unbind events if we tracked instances
  }
}
