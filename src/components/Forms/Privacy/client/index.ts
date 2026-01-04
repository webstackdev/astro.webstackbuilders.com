import { LitElement } from 'lit'
import { actions } from 'astro:actions'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { getPrivacyFormElements } from './selectors'

type MessageType = 'success' | 'error' | 'info'
type RequestType = 'ACCESS' | 'DELETE'

type DsarVerifyResult =
  | { status: 'download'; filename: string; json: string }
  | { status: 'deleted' }
  | { status: string }

type RequestDataResult = { message: string }

export class PrivacyFormElement extends LitElement {
  static readonly registeredName = 'privacy-form'

  override createRenderRoot() {
    return this
  }

  private isInitialized = false

  private statusMessage: HTMLElement | undefined

  private accessForm!: HTMLFormElement
  private accessEmailInput!: HTMLInputElement
  private accessMessage!: HTMLElement

  private deleteForm!: HTMLFormElement
  private deleteEmailInput!: HTMLInputElement
  private deleteConfirmCheckbox!: HTMLInputElement
  private deleteMessage!: HTMLElement

  override connectedCallback(): void {
    super.connectedCallback()

    const context = { scriptName: 'PrivacyFormElement', operation: 'connectedCallback' }
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

  public initialize(): void {
    const context = { scriptName: 'PrivacyFormElement', operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      if (this.isInitialized) return
      this.findElements()
      this.bindEvents()
      this.isInitialized = true

      this.focusStatusMessage()
      void this.handleVerificationToken()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private findElements(): void {
    const context = { scriptName: 'PrivacyFormElement', operation: 'findElements' }
    addScriptBreadcrumb(context)

    try {
      const elements = getPrivacyFormElements(this)

      this.statusMessage = elements.statusMessage

      this.accessForm = elements.accessForm
      this.accessEmailInput = elements.accessEmailInput
      this.accessMessage = elements.accessMessage

      this.deleteForm = elements.deleteForm
      this.deleteEmailInput = elements.deleteEmailInput
      this.deleteConfirmCheckbox = elements.deleteConfirmCheckbox
      this.deleteMessage = elements.deleteMessage
    } catch (error) {
      if (error instanceof ClientScriptError) {
        throw error
      }

      throw new ClientScriptError(
        `PrivacyFormElement: Failed to find elements - ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private bindEvents(): void {
    this.accessForm.addEventListener('submit', event => {
      event.preventDefault()
      void this.handleRequestSubmit({ requestType: 'ACCESS' })
    })

    this.deleteForm.addEventListener('submit', event => {
      event.preventDefault()
      void this.handleRequestSubmit({ requestType: 'DELETE' })
    })
  }

  private focusStatusMessage(): void {
    if (this.statusMessage) {
      this.statusMessage.focus()
    }
  }

  private setMessage(target: HTMLElement, message: string, type: MessageType): void {
    target.setAttribute('role', type === 'error' ? 'alert' : 'status')
    target.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite')
    target.textContent = message
    target.classList.remove('hidden')

    const variantClasses = [
      'border-success',
      'bg-success-bg',
      'text-success',
      'border-danger',
      'bg-danger-bg',
      'text-danger',
      'border-info',
      'bg-info-bg',
      'text-info',
    ]
    target.classList.remove(...variantClasses)

    if (type === 'success') {
      target.classList.add('border-success', 'bg-success-bg', 'text-success')
    }

    if (type === 'error') {
      target.classList.add('border-danger', 'bg-danger-bg', 'text-danger')
    }

    if (type === 'info') {
      target.classList.add('border-info', 'bg-info-bg', 'text-info')
    }

    target.focus()
  }

  private resolveTokenFromQueryString(): string {
    const params = new URLSearchParams(window.location.search)
    return params.get('token') ?? ''
  }

  protected navigateTo(url: string): void {
    window.location.replace(url)
  }

  protected downloadJson(filename: string, json: string): void {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  private async handleVerificationToken(): Promise<void> {
    const token = this.resolveTokenFromQueryString()
    if (!token) return

    try {
      const { data, error } = await actions.gdpr.verifyDsar({ token })
      if (error || !data) {
        this.navigateTo('/privacy/my-data?status=error')
        return
      }

      const result = data as DsarVerifyResult

      if (result.status === 'download' && 'filename' in result && 'json' in result) {
        this.downloadJson(result.filename, result.json)
        this.navigateTo('/privacy/my-data?status=already-completed')
        return
      }

      if (result.status === 'deleted') {
        this.navigateTo('/privacy/my-data?status=deleted')
        return
      }

      this.navigateTo(`/privacy/my-data?status=${encodeURIComponent(result.status)}`)
    } catch {
      this.navigateTo('/privacy/my-data?status=error')
    }
  }

  private async handleRequestSubmit({ requestType }: { requestType: RequestType }): Promise<void> {
    const messageEl = requestType === 'ACCESS' ? this.accessMessage : this.deleteMessage
    const formEl = requestType === 'ACCESS' ? this.accessForm : this.deleteForm
    const emailInput = requestType === 'ACCESS' ? this.accessEmailInput : this.deleteEmailInput

    if (requestType === 'DELETE' && !this.deleteConfirmCheckbox.checked) {
      this.setMessage(messageEl, 'Please confirm you understand the deletion request.', 'error')
      return
    }

    const email = emailInput.value
    this.setMessage(messageEl, 'Sending request...', 'info')

    try {
      const { data, error } = await actions.gdpr.requestData({ email, requestType })
      if (error || !data) {
        this.setMessage(messageEl, error?.message || 'Request failed', 'error')
        return
      }

      const resultData = data as RequestDataResult
      this.setMessage(messageEl, resultData.message, 'success')
      formEl.reset()
    } catch (error) {
      this.setMessage(
        messageEl,
        error instanceof Error ? error.message : 'Network or server error',
        'error'
      )
    }
  }
}

export const registerWebComponent = async (
  tagName = PrivacyFormElement.registeredName
): Promise<void> => {
  defineCustomElement(tagName, PrivacyFormElement)
}

export const registerPrivacyForm = registerWebComponent

export const webComponentModule: WebComponentModule<PrivacyFormElement> = {
  registeredName: PrivacyFormElement.registeredName,
  componentCtor: PrivacyFormElement,
  registerWebComponent,
}
