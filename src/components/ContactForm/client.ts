/**
 * Contact Form Handler
 * Manages form submission, validation, and user interactions for the contact form
 */

import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'
import { handleScriptError, addScriptBreadcrumb } from '@components/scripts/errors'
import { isFormElement, isButtonElement } from '@components/scripts/assertions/elements'

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
 * Contact Form component with instance-specific approach
 * Manages form submission, validation, and user interactions
 */
export class ContactForm {
  static scriptName = 'ContactForm'

  private elements: ContactFormElements | null = null
  private config: ContactFormConfig

  private constructor() {
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
    const context = { scriptName: ContactForm.scriptName, operation: 'discoverElements' }
    addScriptBreadcrumb(context)

    try {
      const form = document.getElementById('contactForm')
      if (!isFormElement(form)) {
        throw new ClientScriptError('ContactForm: Form element not found. Contact form cannot function without the form element.')
      }

      const messages = document.getElementById('formMessages')
      const successMessage = messages?.querySelector('.message-success')
      const errorMessage = messages?.querySelector('.message-error')
      const errorText = document.getElementById('errorMessage')
      const submitBtn = document.getElementById('submitBtn')
      const btnText = submitBtn?.querySelector('.btn-text')
      const btnLoading = submitBtn?.querySelector('.btn-loading')
      const messageTextarea = document.getElementById('message')
      const charCount = document.getElementById('charCount')
      const uppyContainer = document.getElementById('uppyContainer')

      if (
        !(messages instanceof HTMLElement) ||
        !(successMessage instanceof HTMLElement) ||
        !(errorMessage instanceof HTMLElement) ||
        !(errorText instanceof HTMLElement) ||
        !isButtonElement(submitBtn) ||
        !(btnText instanceof HTMLElement) ||
        !(btnLoading instanceof HTMLElement) ||
        !(messageTextarea instanceof HTMLTextAreaElement) ||
        !(charCount instanceof HTMLElement)
      ) {
        throw new ClientScriptError('ContactForm: Required DOM elements not found. Form requires all elements to function.')
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
    } catch (error) {
      if (error instanceof ClientScriptError) {
        throw error
      }
      handleScriptError(error, context)
      return false
    }
  }

  private initializeForm(): void {
    const context = { scriptName: ContactForm.scriptName, operation: 'initializeForm' }
    addScriptBreadcrumb(context)

    try {
      if (!this.elements) return

      this.setupCharacterCounter()
      this.setupFileUploadPlaceholder()
      this.setupFormSubmission()
      this.setupFormValidation()
      this.addErrorStyles()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private setupCharacterCounter(): void {
    const context = { scriptName: ContactForm.scriptName, operation: 'setupCharacterCounter' }
    addScriptBreadcrumb(context)

    try {
      if (!this.elements) return

      this.elements.messageTextarea.addEventListener('input', () => {
        try {
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
        } catch (error) {
          handleScriptError(error, { scriptName: ContactForm.scriptName, operation: 'characterCountUpdate' })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private setupFileUploadPlaceholder(): void {
    const context = { scriptName: ContactForm.scriptName, operation: 'setupFileUploadPlaceholder' }
    addScriptBreadcrumb(context)

    try {
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
    } catch (error) {
      // File upload placeholder is optional
      handleScriptError(error, context)
    }
  }

  private setupFormSubmission(): void {
    const context = { scriptName: ContactForm.scriptName, operation: 'setupFormSubmission' }
    addScriptBreadcrumb(context)

    try {
      if (!this.elements) return

      this.elements.form.addEventListener('submit', async e => {
        try {
          e.preventDefault()
          await this.handleFormSubmission()
        } catch (error) {
          handleScriptError(error, { scriptName: ContactForm.scriptName, operation: 'formSubmit' })
          this.showErrorMessage('An error occurred. Please try again.')
          this.setLoading(false)
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private async handleFormSubmission(): Promise<void> {
    const context = { scriptName: ContactForm.scriptName, operation: 'handleFormSubmission' }
    addScriptBreadcrumb(context)

    try {
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
        handleScriptError(error, { scriptName: ContactForm.scriptName, operation: 'apiSubmission' })
        this.showErrorMessage('Unable to send message. Please try again later.')
      } finally {
        this.setLoading(false)
      }
    } catch (error) {
      handleScriptError(error, context)
      this.setLoading(false)
    }
  }

  private setLoading(loading: boolean): void {
    const context = { scriptName: ContactForm.scriptName, operation: 'setLoading' }
    addScriptBreadcrumb(context)

    try {
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
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private showSuccessMessage(): void {
    const context = { scriptName: ContactForm.scriptName, operation: 'showSuccessMessage' }
    addScriptBreadcrumb(context)

    try {
      if (!this.elements) return

      this.elements.messages.style.display = 'block'
      this.elements.successMessage.classList.remove('hidden')
      this.elements.errorMessage.classList.add('hidden')
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private showErrorMessage(message: string): void {
    const context = { scriptName: ContactForm.scriptName, operation: 'showErrorMessage' }
    addScriptBreadcrumb(context)

    try {
      if (!this.elements) return

      this.elements.messages.style.display = 'block'
      this.elements.successMessage.classList.add('hidden')
      this.elements.errorMessage.classList.remove('hidden')
      this.elements.errorMessage.style.display = 'flex'
      this.elements.errorText.textContent = message
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private hideMessages(): void {
    const context = { scriptName: ContactForm.scriptName, operation: 'hideMessages' }
    addScriptBreadcrumb(context)

    try {
      if (!this.elements) return

      this.elements.messages.style.display = 'none'
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private resetForm(): void {
    const context = { scriptName: ContactForm.scriptName, operation: 'resetForm' }
    addScriptBreadcrumb(context)

    try {
      if (!this.elements) return

      this.elements.form.reset()
      this.elements.charCount.textContent = '0'
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private setupFormValidation(): void {
    const context = { scriptName: ContactForm.scriptName, operation: 'setupFormValidation' }
    addScriptBreadcrumb(context)

    try {
      if (!this.elements) return

      const inputs = this.elements.form.querySelectorAll('input, select, textarea')
      inputs.forEach(input => {
        try {
          input.addEventListener('blur', () => {
            try {
              if (input instanceof HTMLInputElement) {
                this.validateField(input)
              }
            } catch (error) {
              handleScriptError(error, { scriptName: ContactForm.scriptName, operation: 'validateOnBlur' })
            }
          })

          input.addEventListener('input', () => {
            try {
              if (input.classList.contains('error')) {
                if (input instanceof HTMLInputElement) {
                  this.validateField(input)
                }
              }
            } catch (error) {
              handleScriptError(error, { scriptName: ContactForm.scriptName, operation: 'validateOnInput' })
            }
          })
        } catch (error) {
          // One field failing shouldn't break all validation
          handleScriptError(error, { scriptName: ContactForm.scriptName, operation: 'setupFieldValidation' })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Static initialization method
   */
  static init(): void {
    const context = { scriptName: ContactForm.scriptName, operation: 'init' }
    addScriptBreadcrumb(context)

    try {
      // Create instance and discover elements
      const instance = new ContactForm()
      if (instance.discoverElements()) {
        instance.initializeForm()
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  static pause(): void {
    // Contact form doesn't need pause functionality during visibility changes
  }

  static resume(): void {
    // Contact form doesn't need resume functionality during visibility changes
  }

  static reset(): void {
    // Clean up any global state if needed for View Transitions
    // Remove any event listeners or reset form state if necessary
  }

  public validateField(field: HTMLInputElement): boolean {
    const context = { scriptName: ContactForm.scriptName, operation: 'validateField' }
    addScriptBreadcrumb(context)

    try {
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
    } catch (error) {
      handleScriptError(error, context)
      return false
    }
  }

  private addErrorStyles(): void {
    const context = { scriptName: ContactForm.scriptName, operation: 'addErrorStyles' }
    addScriptBreadcrumb(context)

    try {
      const style = document.createElement('style')
      style.textContent = `
        .form-input.error,
        .form-select.error,
        .form-textarea.error {
          border-color: var(--color-danger);
        }
      `
      document.head.appendChild(style)
    } catch (error) {
      // Error styles are optional enhancement
      handleScriptError(error, context)
    }
  }
}
