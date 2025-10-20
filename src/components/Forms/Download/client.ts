import { LoadableScript, type TriggerEvent } from '@components/Scripts/loader/@types/loader'
import { logger } from '@lib/logger'
import {
  getDownloadFormElement,
  getDownloadSubmitButton,
  getDownloadStatusDiv,
  getDownloadButtonWrapper,
} from './selectors'
import { ClientScriptError } from '@components/Scripts/errors/ClientScriptError'
import { handleScriptError, addScriptBreadcrumb } from '@components/Scripts/errors'

/**
 * DownloadForm component using LoadableScript pattern
 * Handles form submission for gated download resources
 */
export class DownloadForm extends LoadableScript {
  static override scriptName = 'DownloadForm'
  static override eventType: TriggerEvent = 'astro:page-load'

  private form: HTMLFormElement
  private submitButton: HTMLButtonElement
  private statusDiv: HTMLElement
  private downloadButtonWrapper: HTMLElement

  constructor() {
    super()

    const context = { scriptName: DownloadForm.scriptName, operation: 'constructor' }
    addScriptBreadcrumb(context)

    try {
      this.form = getDownloadFormElement()
      this.submitButton = getDownloadSubmitButton()
      this.statusDiv = getDownloadStatusDiv()
      this.downloadButtonWrapper = getDownloadButtonWrapper()
    } catch (error) {
      throw new ClientScriptError(
        `DownloadForm: Failed to find required DOM elements - ${error instanceof Error ? error.message : 'Unknown error'}. Download form cannot function without these elements.`
      )
    }
  }

  bindEvents(): void {
    const context = { scriptName: DownloadForm.scriptName, operation: 'bindEvents' }
    addScriptBreadcrumb(context)

    try {
      this.form.addEventListener('submit', this.handleSubmit.bind(this))
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private async handleSubmit(event: Event): Promise<void> {
    const context = { scriptName: DownloadForm.scriptName, operation: 'handleSubmit' }
    addScriptBreadcrumb(context)

    try {
      event.preventDefault()

      // Disable submit button
      this.submitButton.disabled = true
      this.submitButton.textContent = 'Processing...'

      // Collect form data
      const formData = new FormData(this.form)
      const data = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        workEmail: formData.get('workEmail'),
        jobTitle: formData.get('jobTitle'),
        companyName: formData.get('companyName'),
      }

      try {
        // Submit to API endpoint
        const response = await fetch('/api/downloads/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error('Failed to submit form')
        }

        await response.json()

        // Show success message
        this.showStatus('success', 'Thank you! Click the button below to download your resource.')

        // Show the download button
        this.downloadButtonWrapper.classList.remove('hidden')

        // Hide the submit button
        this.submitButton.classList.add('hidden')

        // Reset form
        this.form.reset()
      } catch (error) {
        logger.error('Error submitting download form', error)
        handleScriptError(error, { scriptName: DownloadForm.scriptName, operation: 'apiSubmission' })
        this.showStatus('error', 'There was an error processing your request. Please try again.')
      } finally {
        // Re-enable submit button (in case of error)
        this.submitButton.disabled = false
        this.submitButton.textContent = 'Download Now'
      }
    } catch (error) {
      handleScriptError(error, context)
      this.showStatus('error', 'An error occurred. Please try again.')
      this.submitButton.disabled = false
      this.submitButton.textContent = 'Download Now'
    }
  }

  private showStatus(type: 'success' | 'error', message: string): void {
    const context = { scriptName: DownloadForm.scriptName, operation: 'showStatus' }
    addScriptBreadcrumb(context)

    try {
      this.statusDiv.className = type
      this.statusDiv.textContent = message
      this.statusDiv.classList.remove('hidden')

      // Hide after 5 seconds
      setTimeout(() => {
        try {
          this.statusDiv.classList.add('hidden')
        } catch (error) {
          handleScriptError(error, { scriptName: DownloadForm.scriptName, operation: 'hideStatus' })
        }
      }, 5000)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * LoadableScript static methods
   */
  static override init(): void {
    const context = { scriptName: DownloadForm.scriptName, operation: 'init' }
    addScriptBreadcrumb(context)

    try {
      // Only initialize if the form exists on the page
      const formElement = document.getElementById('downloadForm')
      if (!formElement) {
        return
      }

      const downloadForm = new DownloadForm()
      downloadForm.bindEvents()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  static override pause(): void {
    // DownloadForm doesn't need pause functionality
  }

  static override resume(): void {
    // DownloadForm doesn't need resume functionality
  }

  static override reset(): void {
    // Clean up any global state if needed for View Transitions
  }
}
