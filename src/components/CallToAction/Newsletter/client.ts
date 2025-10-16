/**
 * Newsletter subscription form client-side logic using LoadableScript pattern
 * Manages form validation, submission, and UI state changes
 */

import { LoadableScript, type TriggerEvent } from '../../Scripts/loader/@types/loader'

/**
 * Newsletter form component using LoadableScript pattern with instance-specific approach
 */
export class NewsletterForm extends LoadableScript {
  static override scriptName = 'NewsletterForm'
  static override eventType: TriggerEvent = 'astro:page-load'

  // Email validation pattern (matches server-side)
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // DOM elements
  private form: HTMLFormElement | null = null
  private emailInput: HTMLInputElement | null = null
  private submitButton: HTMLButtonElement | null = null
  private buttonText: HTMLSpanElement | null = null
  private buttonArrow: SVGSVGElement | null = null
  private buttonSpinner: SVGSVGElement | null = null
  private message: HTMLParagraphElement | null = null
  private originalButtonText = 'Subscribe'

  constructor() {
    super()
    this.initializeElements()
  }

  /**
   * Initialize DOM element references
   */
  private initializeElements(): void {
    this.form = document.getElementById('newsletter-form') as HTMLFormElement | null
    this.emailInput = document.getElementById('newsletter-email') as HTMLInputElement | null
    this.submitButton = document.getElementById('newsletter-submit') as HTMLButtonElement | null
    this.buttonText = document.getElementById('button-text') as HTMLSpanElement | null
    this.buttonArrow = document.getElementById('button-arrow') as SVGSVGElement | null
    this.buttonSpinner = document.getElementById('button-spinner') as SVGSVGElement | null
    this.message = document.getElementById('newsletter-message') as HTMLParagraphElement | null

    if (!this.form || !this.emailInput || !this.submitButton || !this.buttonText ||
        !this.buttonArrow || !this.buttonSpinner || !this.message) {
      console.warn('Newsletter form: Some DOM elements not found')
      return
    }

    // Save original button text
    this.originalButtonText = this.buttonText.textContent || 'Subscribe'
    this.submitButton.setAttribute('data-original-text', this.originalButtonText)
  }

  /**
   * Validate email address format
   */
  public validateEmail(email: string): boolean {
    return this.emailRegex.test(email)
  }

  /**
   * Display a message to the user
   */
  public showMessage(text: string, type: 'success' | 'error' | 'info'): void {
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
  }

  /**
   * Set the loading state of the submit button
   */
  public setLoading(loading: boolean): void {
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
  }

  /**
   * Handle form submission
   */
  private handleSubmit = async (e: Event): Promise<void> => {
    e.preventDefault()

    if (!this.emailInput) return

    const email = this.emailInput.value.trim()

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

    // Submit to API
    this.setLoading(true)
    this.showMessage('Subscribing...', 'info')

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        this.showMessage(data.message || 'Successfully subscribed! Check your email.', 'success')
        this.form?.reset()
      } else {
        this.showMessage(data.error || 'Failed to subscribe. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      this.showMessage('Network error. Please check your connection and try again.', 'error')
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Handle email input blur for real-time validation
   */
  private handleEmailBlur = (): void => {
    if (!this.emailInput) return

    const email = this.emailInput.value.trim()

    if (email && !this.validateEmail(email)) {
      this.showMessage('Please enter a valid email address.', 'error')
    } else if (email) {
      this.showMessage('We respect your privacy. Unsubscribe at any time.', 'info')
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents(): void {
    if (!this.form || !this.emailInput) {
      console.warn('Newsletter form: Cannot bind events - required elements not found')
      return
    }

    this.form.addEventListener('submit', this.handleSubmit)
    this.emailInput.addEventListener('blur', this.handleEmailBlur)
  }

  /**
   * Remove event listeners for cleanup
   */
  unbindEvents(): void {
    if (this.form) {
      this.form.removeEventListener('submit', this.handleSubmit)
    }
    if (this.emailInput) {
      this.emailInput.removeEventListener('blur', this.handleEmailBlur)
    }
  }

  /**
   * LoadableScript static methods
   */
  static override init(): void {
    const newsletterForm = new NewsletterForm()
    newsletterForm.bindEvents()
  }

  static override pause(): void {
    // Newsletter form doesn't need pause functionality during visibility changes
  }

  static override resume(): void {
    // Newsletter form doesn't need resume functionality during visibility changes
  }

  static override reset(): void {
    // Clean up any global state if needed for View Transitions
    // This could be enhanced to unbind events if we tracked instances
  }
}