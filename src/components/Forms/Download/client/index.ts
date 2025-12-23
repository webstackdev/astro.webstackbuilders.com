import { LitElement } from 'lit'
import { actions } from 'astro:actions'
import {
  getDownloadButtonWrapper,
  getDownloadFormElement,
  getDownloadStatusDiv,
  getDownloadSubmitButton,
} from './selectors'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

const scriptName = 'DownloadFormElement'

export class DownloadFormElement extends LitElement {
  private form: HTMLFormElement | null = null
  private submitButton: HTMLButtonElement | null = null
  private statusDiv: HTMLElement | null = null
  private downloadButtonWrapper: HTMLElement | null = null
  private readonly boundSubmitHandler = (event: Event) => {
    void this.handleSubmit(event)
  }

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.initialize()
  }

  override disconnectedCallback(): void {
    if (this.form) {
      this.form.removeEventListener('submit', this.boundSubmitHandler)
    }
    super.disconnectedCallback()
  }

  private initialize(): void {
    const context = { scriptName, operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      this.form = getDownloadFormElement(this)
      this.submitButton = getDownloadSubmitButton(this)
      this.statusDiv = getDownloadStatusDiv(this)
      this.downloadButtonWrapper = getDownloadButtonWrapper(this)

      if (!this.form) {
        throw new ClientScriptError({ message: 'Download form element missing during init' })
      }

      this.form.addEventListener('submit', this.boundSubmitHandler)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private getElements() {
    if (!this.form || !this.submitButton || !this.statusDiv || !this.downloadButtonWrapper) {
      throw new ClientScriptError({
        message: 'DownloadFormElement missing required DOM references',
      })
    }

    return {
      form: this.form,
      submitButton: this.submitButton,
      statusDiv: this.statusDiv,
      downloadButtonWrapper: this.downloadButtonWrapper,
    }
  }

  private syncAriaInvalidState(form: HTMLFormElement): void {
    const invalidControls = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea',
    )

    invalidControls.forEach((control) => {
      if (control.willValidate && !control.checkValidity()) {
        control.setAttribute('aria-invalid', 'true')
        return
      }
      control.removeAttribute('aria-invalid')
    })
  }

  private async handleSubmit(event: Event): Promise<void> {
    const context = { scriptName, operation: 'handleSubmit' }
    addScriptBreadcrumb(context)

    try {
      event.preventDefault()
      const { form, submitButton, downloadButtonWrapper } = this.getElements()

      if (!form.checkValidity()) {
        form.reportValidity()
        this.syncAriaInvalidState(form)
        this.showStatus('error', 'Please complete all required fields before continuing.')
        return
      }

      submitButton.disabled = true
      submitButton.textContent = 'Processing...'

      const formData = new FormData(form)
      const payload = {
        firstName: String(formData.get('firstName') ?? ''),
        lastName: String(formData.get('lastName') ?? ''),
        workEmail: String(formData.get('workEmail') ?? ''),
        jobTitle: String(formData.get('jobTitle') ?? ''),
        companyName: String(formData.get('companyName') ?? ''),
      }

      try {
        const result = await actions.downloads.submit(payload)

        if (result.error || !result.data?.success) {
          throw new ClientScriptError({ message: result.error?.message || 'Failed to submit form' })
        }

        this.showStatus('success', 'Thank you! Click the button below to download your resource.')

        submitButton.dispatchEvent(
          new CustomEvent('confetti:fire', {
            bubbles: true,
            composed: true,
          }),
        )

        downloadButtonWrapper.classList.remove('hidden')
        submitButton.classList.add('hidden')
        form.reset()
        this.syncAriaInvalidState(form)
      } catch (error) {
        handleScriptError(error, { scriptName, operation: 'apiSubmission' })
        this.showStatus('error', 'There was an error processing your request. Please try again.')
      } finally {
        submitButton.disabled = false
        submitButton.textContent = 'Download Now'
      }
    } catch (error) {
      handleScriptError(error, context)
      this.showStatus('error', 'An error occurred. Please try again.')
      if (this.submitButton) {
        this.submitButton.disabled = false
        this.submitButton.textContent = 'Download Now'
      }
    }
  }

  private showStatus(type: 'success' | 'error', message: string): void {
    const context = { scriptName, operation: 'showStatus' }
    addScriptBreadcrumb(context)

    try {
      const { statusDiv } = this.getElements()

      if (type === 'error') {
        statusDiv.setAttribute('role', 'alert')
        statusDiv.setAttribute('aria-live', 'assertive')
      } else {
        statusDiv.setAttribute('role', 'status')
        statusDiv.setAttribute('aria-live', 'polite')
      }

      statusDiv.textContent = message
      statusDiv.classList.remove('hidden', 'success', 'error')
      statusDiv.classList.add(type)

      setTimeout(() => {
        try {
          statusDiv.classList.add('hidden')
        } catch (error) {
          handleScriptError(error, { scriptName, operation: 'hideStatus' })
        }
      }, 5000)
    } catch (error) {
      handleScriptError(error, context)
    }
  }
}

const elementName = 'download-form'

export const registerDownloadFormWebComponent = (tagName = elementName) => {
  if (typeof window === 'undefined') {
    return
  }

  defineCustomElement(tagName, DownloadFormElement)
}

export const webComponentModule: WebComponentModule<DownloadFormElement> = {
  registeredName: elementName,
  componentCtor: DownloadFormElement,
  registerWebComponent: registerDownloadFormWebComponent,
}
