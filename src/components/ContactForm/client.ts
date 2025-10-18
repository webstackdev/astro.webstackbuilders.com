/**
 * Contact Form Handler
 * Manages form submission, validation, and user interactions for the contact form
 * Uses LoadableScript pattern for proper initialization timing
 */

import { LoadableScript, type TriggerEvent } from '../Scripts/loader/@types/loader'

export interface ContactFormElements {
  form: HTMLFormElement
  messages: HTMLElement
  successMessage: HTMLElement
  errorMessage: HTMLElement
  errorText: HTMLElement
  submitBtn: HTMLButtonElement
  btnText: HTMLElement
  btnLoading: HTMLElement
  messageTextarea: HTMLTextAreaElement
  charCount: HTMLElement
  uppyContainer: HTMLElement | null
}

export interface ContactFormData {
  name: string
  email: string
  company?: string
  phone?: string
  project_type?: string
  budget?: string
  timeline?: string
  message: string
}

export interface ContactFormConfig {
  maxCharacters: number
  warningThreshold: number
  errorThreshold: number
  apiEndpoint: string
}

/**
 * Contact Form component using LoadableScript pattern with instance-specific approach
 * Manages form submission, validation, and user interactions
 */
export class ContactForm extends LoadableScript {
  static override scriptName = 'ContactForm'
  static override eventType: TriggerEvent = 'astro:page-load'

  private elements: ContactFormElements | null = null
  private config: ContactFormConfig

  private constructor() {
    super()
    this.config = {
      maxCharacters: 2000,
      warningThreshold: 1500,
      errorThreshold: 1800,
      apiEndpoint: '/api/contact',
    }
  }

  /**
   * Discover and cache DOM elements
   */
  private discoverElements(): boolean {
    const form = document.getElementById('contactForm') as HTMLFormElement
    if (!form) return false

    const messages = document.getElementById('formMessages') as HTMLElement
    const successMessage = messages?.querySelector('.message-success') as HTMLElement
    const errorMessage = messages?.querySelector('.message-error') as HTMLElement
    const errorText = document.getElementById('errorMessage') as HTMLElement
    const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement
    const btnText = submitBtn?.querySelector('.btn-text') as HTMLElement
    const btnLoading = submitBtn?.querySelector('.btn-loading') as HTMLElement
    const messageTextarea = document.getElementById('message') as HTMLTextAreaElement
    const charCount = document.getElementById('charCount') as HTMLElement
    const uppyContainer = document.getElementById('uppyContainer')

    if (
      !messages ||
      !successMessage ||
      !errorMessage ||
      !errorText ||
      !submitBtn ||
      !btnText ||
      !btnLoading ||
      !messageTextarea ||
      !charCount
    ) {
      console.warn('ContactForm: Some required DOM elements not found')
      return false
    }

    this.elements = {
      form,
      messages,
      successMessage,
      errorMessage,
      errorText,
      submitBtn,
      btnText,
      btnLoading,
      messageTextarea,
      charCount,
      uppyContainer,
    }

    return true
  }

  private initializeForm(): void {
    if (!this.elements) return

    this.setupCharacterCounter()
    this.setupFileUploadPlaceholder()
    this.setupFormSubmission()
    this.setupFormValidation()
    this.addErrorStyles()
  }

  private setupCharacterCounter(): void {
    if (!this.elements) return

    this.elements.messageTextarea.addEventListener('input', () => {
      if (!this.elements) return
      const count = this.elements.messageTextarea.value.length
      this.elements.charCount.textContent = count.toString()

      if (count > this.config.errorThreshold) {
        this.elements.charCount.style.color = 'var(--color-danger)'
      } else if (count > this.config.warningThreshold) {
        this.elements.charCount.style.color = 'var(--color-warning)'
      } else {
        this.elements.charCount.style.color = 'var(--color-text-offset)'
      }
    })
  }

  private setupFileUploadPlaceholder(): void {
    if (!this.elements || !this.elements.uppyContainer) return

    this.elements.uppyContainer.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: var(--color-text-offset);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 1rem; opacity: 0.5;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10,9 9,9 8,9"></polyline>
        </svg>
        <p style="margin: 0; font-size: 1rem; font-weight: 500;">File Upload Coming Soon</p>
        <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem;">In production, this would integrate with Uppy.js for drag-and-drop file uploads</p>
      </div>
    `
  }

  private setupFormSubmission(): void {
    if (!this.elements) return

    this.elements.form.addEventListener('submit', async e => {
      e.preventDefault()
      await this.handleFormSubmission()
    })
  }

  private async handleFormSubmission(): Promise<void> {
    if (!this.elements) return

    this.setLoading(true)
    this.hideMessages()

    try {
      const formData = new FormData(this.elements.form)
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        this.showSuccessMessage()
        this.resetForm()
      } else {
        this.showErrorMessage(result.message || 'An error occurred while sending your message.')
      }
    } catch (error) {
      console.error('ContactForm: Form submission error:', error)
      this.showErrorMessage('Unable to send message. Please try again later.')
    } finally {
      this.setLoading(false)
    }
  }

  private setLoading(loading: boolean): void {
    if (!this.elements) return

    this.elements.submitBtn.disabled = loading

    if (loading) {
      this.elements.btnText.style.display = 'none'
      this.elements.btnLoading.classList.remove('hidden')
      this.elements.btnLoading.style.display = 'flex'
    } else {
      this.elements.btnText.style.display = 'inline'
      this.elements.btnLoading.classList.add('hidden')
      this.elements.btnLoading.style.display = 'none'
    }
  }

  private showSuccessMessage(): void {
    if (!this.elements) return

    this.elements.messages.style.display = 'block'
    this.elements.successMessage.classList.remove('hidden')
    this.elements.errorMessage.classList.add('hidden')
  }

  private showErrorMessage(message: string): void {
    if (!this.elements) return

    this.elements.messages.style.display = 'block'
    this.elements.successMessage.classList.add('hidden')
    this.elements.errorMessage.classList.remove('hidden')
    this.elements.errorMessage.style.display = 'flex'
    this.elements.errorText.textContent = message
  }

  private hideMessages(): void {
    if (!this.elements) return

    this.elements.messages.style.display = 'none'
  }

  private resetForm(): void {
    if (!this.elements) return

    this.elements.form.reset()
    this.elements.charCount.textContent = '0'
  }

  private setupFormValidation(): void {
    if (!this.elements) return

    const inputs = this.elements.form.querySelectorAll('input, select, textarea')
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateField(input as HTMLInputElement)
      })

      input.addEventListener('input', () => {
        if (input.classList.contains('error')) {
          this.validateField(input as HTMLInputElement)
        }
      })
    })
  }

  /**
   * LoadableScript static methods
   */
  static override init(): void {
    // Create instance and discover elements
    const instance = new ContactForm()
    if (instance.discoverElements()) {
      instance.initializeForm()
    }
  }

  static override pause(): void {
    // Contact form doesn't need pause functionality during visibility changes
  }

  static override resume(): void {
    // Contact form doesn't need resume functionality during visibility changes
  }

  static override reset(): void {
    // Clean up any global state if needed for View Transitions
    // Remove any event listeners or reset form state if necessary
  }

  public validateField(field: HTMLInputElement): boolean {
    const value = field.value.trim()
    let isValid = true
    let errorMessage = ''

    // Remove previous error styling
    field.classList.remove('error')
    const existingError = field.parentNode?.querySelector('.field-error')
    if (existingError) {
      existingError.remove()
    }

    // Required field validation
    if (field.hasAttribute('required') && !value) {
      isValid = false
      errorMessage = 'This field is required'
    }
    // Email validation
    else if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        isValid = false
        errorMessage = 'Please enter a valid email address'
      }
    }
    // Length validation
    else if (
      field.hasAttribute('minlength') &&
      value.length < parseInt(field.getAttribute('minlength') || '0')
    ) {
      isValid = false
      errorMessage = `Minimum ${field.getAttribute('minlength')} characters required`
    } else if (
      field.hasAttribute('maxlength') &&
      value.length > parseInt(field.getAttribute('maxlength') || '0')
    ) {
      isValid = false
      errorMessage = `Maximum ${field.getAttribute('maxlength')} characters allowed`
    }

    if (!isValid) {
      field.classList.add('error')
      const errorDiv = document.createElement('div')
      errorDiv.className = 'field-error'
      errorDiv.textContent = errorMessage
      errorDiv.style.cssText =
        'color: var(--color-danger); font-size: 0.85rem; margin-top: 0.25rem;'
      field.parentNode?.appendChild(errorDiv)
    }

    return isValid
  }

  private addErrorStyles(): void {
    const style = document.createElement('style')
    style.textContent = `
      .form-input.error,
      .form-select.error,
      .form-textarea.error {
        border-color: var(--color-danger);
      }
    `
    document.head.appendChild(style)
  }
}
