import { LitElement } from 'lit'
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

  private async handleSubmit(event: Event): Promise<void> {
    const context = { scriptName, operation: 'handleSubmit' }
    addScriptBreadcrumb(context)

    try {
      event.preventDefault()
      const { form, submitButton, downloadButtonWrapper } = this.getElements()

      submitButton.disabled = true
      submitButton.textContent = 'Processing...'

      const formData = new FormData(form)
      const payload = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        workEmail: formData.get('workEmail'),
        jobTitle: formData.get('jobTitle'),
        companyName: formData.get('companyName'),
      }

      try {
        const response = await fetch('/api/downloads/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new ClientScriptError({
            message: 'Failed to submit form',
          })
        }

        await response.json()

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
