import { LitElement } from 'lit'
import { actions } from 'astro:actions'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { getPrivacyFormElements } from './selectors'

type MessageType = 'success' | 'error' | 'info'
type RequestType = 'ACCESS' | 'DELETE'
type RequestPreviewState = 'loading' | 'success' | 'error' | 'validation'
type RequestFormType = 'access' | 'delete'

type DsarVerifyResult =
  | { status: 'download'; filename: string; json: string }
  | { status: 'deleted' }
  | { status: string }

type RequestDataResult = { message: string }

const requestPreviewStates = ['loading', 'success', 'error', 'validation'] as const

const requestPreviewQueryParams: Record<RequestFormType, string> = {
  access: 'accessState',
  delete: 'deleteState',
}

const statusMessages: Record<string, { type: MessageType; message: string }> = {
  sent: {
    type: 'success',
    message:
      'Verification email sent! Please check your inbox and click the link to complete your request.',
  },
  invalid: {
    type: 'error',
    message: 'Invalid or expired verification link. Please submit a new request.',
  },
  expired: {
    type: 'error',
    message: 'This verification link has expired. Please submit a new request.',
  },
  'already-completed': { type: 'info', message: 'This request has already been completed.' },
  deleted: {
    type: 'success',
    message: 'Your data has been successfully deleted from our systems.',
  },
  error: { type: 'error', message: 'An error occurred. Please try again or contact support.' },
}

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

      this.renderRequestPreviewStatesFromQueryString()
      this.renderStatusFromQueryString()
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

  private setRequestState(form: HTMLFormElement, state: RequestPreviewState | 'idle'): void {
    form.dataset.privacyState = state
    form.setAttribute('aria-busy', String(state === 'loading'))
  }

  private setSubmitLoading(form: HTMLFormElement, loading: boolean): void {
    const submitButton = form.querySelector('button[type="submit"]')
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = loading
    }
  }

  private setEmailInvalid(input: HTMLInputElement, invalid: boolean): void {
    input.setAttribute('aria-invalid', String(invalid))
    input.classList.toggle('border-danger', invalid)
    input.classList.toggle('focus:border-danger', invalid)
  }

  private setDeleteConfirmationInvalid(invalid: boolean): void {
    this.deleteConfirmCheckbox.setAttribute('aria-invalid', String(invalid))
  }

  private resetMessage(target: HTMLElement): void {
    target.textContent = ''
    target.classList.add('hidden')
    target.classList.remove(
      'border-success',
      'bg-success-inverse',
      'text-success',
      'border-danger',
      'bg-danger-offset',
      'text-danger',
      'border-info',
      'bg-info-inverse',
      'text-info'
    )
  }

  private resetRequestState(requestType: RequestType): void {
    const isAccessRequest = requestType === 'ACCESS'
    const form = isAccessRequest ? this.accessForm : this.deleteForm
    const emailInput = isAccessRequest ? this.accessEmailInput : this.deleteEmailInput
    const message = isAccessRequest ? this.accessMessage : this.deleteMessage

    this.resetMessage(message)
    this.setRequestState(form, 'idle')
    this.setSubmitLoading(form, false)
    this.setEmailInvalid(emailInput, false)

    if (!isAccessRequest) {
      this.setDeleteConfirmationInvalid(false)
    }
  }

  private setMessage(
    target: HTMLElement,
    message: string,
    type: MessageType,
    options: { focus?: boolean } = {}
  ): void {
    target.setAttribute('role', type === 'error' ? 'alert' : 'status')
    target.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite')
    target.textContent = message
    target.classList.remove('hidden')

    const variantClasses = [
      'border-success',
      'bg-success-inverse',
      'text-success',
      'border-danger',
      'bg-danger-offset',
      'text-danger',
      'border-info',
      'bg-info-inverse',
      'text-info',
    ]
    target.classList.remove(...variantClasses)

    if (type === 'success') {
      target.classList.add('border-success', 'bg-success-inverse', 'text-success')
    }

    if (type === 'error') {
      target.classList.add('border-danger', 'bg-danger-offset', 'text-danger')
    }

    if (type === 'info') {
      target.classList.add('border-info', 'bg-info-inverse', 'text-info')
    }

    if (options.focus ?? true) {
      target.focus()
    }
  }

  private resolvePreviewState(
    params: URLSearchParams,
    requestFormType: RequestFormType
  ): RequestPreviewState | null {
    const previewState = params.get(requestPreviewQueryParams[requestFormType])?.trim().toLowerCase()

    if (!previewState) {
      return null
    }

    return requestPreviewStates.includes(previewState as RequestPreviewState)
      ? (previewState as RequestPreviewState)
      : null
  }

  private applyRequestPreviewState(
    requestType: RequestType,
    previewState: RequestPreviewState
  ): void {
    this.resetRequestState(requestType)

    const isAccessRequest = requestType === 'ACCESS'
    const form = isAccessRequest ? this.accessForm : this.deleteForm
    const emailInput = isAccessRequest ? this.accessEmailInput : this.deleteEmailInput
    const message = isAccessRequest ? this.accessMessage : this.deleteMessage

    switch (previewState) {
      case 'loading':
        this.setRequestState(form, 'loading')
        this.setSubmitLoading(form, true)
        this.setMessage(message, 'Sending request...', 'info', { focus: false })
        return

      case 'success':
        this.setRequestState(form, 'success')
        this.setMessage(
          message,
          isAccessRequest
            ? 'Data access request sent. Please check your inbox to verify the request.'
            : 'Deletion request sent. Please check your inbox to verify the request.',
          'success',
          { focus: false }
        )
        return

      case 'error':
        this.setRequestState(form, 'error')
        this.setMessage(
          message,
          isAccessRequest
            ? 'Unable to submit your data request. Please try again.'
            : 'Unable to submit your deletion request. Please try again.',
          'error',
          { focus: false }
        )
        return

      case 'validation':
        this.setRequestState(form, 'validation')
        this.setEmailInvalid(emailInput, true)

        if (isAccessRequest) {
          this.setMessage(message, 'Please enter a valid email address.', 'error', { focus: false })
          return
        }

        this.setDeleteConfirmationInvalid(true)
        this.setMessage(
          message,
          'Please enter a valid email address and confirm the deletion request.',
          'error',
          { focus: false }
        )
        return
    }
  }

  private renderRequestPreviewStatesFromQueryString(): void {
    const params = new URLSearchParams(window.location.search)
    const accessPreviewState = this.resolvePreviewState(params, 'access')
    const deletePreviewState = this.resolvePreviewState(params, 'delete')

    if (accessPreviewState) {
      this.applyRequestPreviewState('ACCESS', accessPreviewState)
    }

    if (deletePreviewState) {
      this.applyRequestPreviewState('DELETE', deletePreviewState)
    }
  }

  private renderStatusFromQueryString(): void {
    if (!this.statusMessage) return

    const status = new URLSearchParams(window.location.search).get('status')
    if (!status) return

    const statusMessage = statusMessages[status]
    if (!statusMessage) return

    this.setMessage(this.statusMessage, statusMessage.message, statusMessage.type)
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

    this.resetRequestState(requestType)

    if (requestType === 'DELETE' && !this.deleteConfirmCheckbox.checked) {
      this.setRequestState(formEl, 'validation')
      this.setDeleteConfirmationInvalid(true)
      this.setMessage(messageEl, 'Please confirm you understand the deletion request.', 'error')
      return
    }

    const email = emailInput.value
    this.setRequestState(formEl, 'loading')
    this.setSubmitLoading(formEl, true)
    this.setMessage(messageEl, 'Sending request...', 'info')

    try {
      const { data, error } = await actions.gdpr.requestData({ email, requestType })
      if (error || !data) {
        this.setRequestState(formEl, 'error')
        this.setSubmitLoading(formEl, false)
        this.setMessage(messageEl, error?.message || 'Request failed', 'error')
        return
      }

      const resultData = data as RequestDataResult
      this.setRequestState(formEl, 'success')
      this.setSubmitLoading(formEl, false)
      this.setMessage(messageEl, resultData.message, 'success')
      formEl.reset()
    } catch (error) {
      this.setRequestState(formEl, 'error')
      this.setSubmitLoading(formEl, false)
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
