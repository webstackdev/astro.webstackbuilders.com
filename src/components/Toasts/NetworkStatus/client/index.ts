import { LitElement, html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { queryConnectionStatusIndicator, queryNetworkStatusIconMarkup } from './selectors'

type ToastType = 'success' | 'error'

const TOAST_HIDE_TIMEOUT = 3000
const ICON_BANK_ID = 'network-status-toast-icon-bank'

export class NetworkStatusToastElement extends LitElement {
  static registeredName = 'network-status-toast'

  static override properties = {
    visible: { type: Boolean },
    toastType: { type: String },
    message: { type: String },
  }

  private hideTimeout: ReturnType<typeof setTimeout> | null = null

  declare visible: boolean
  declare toastType: ToastType
  declare message: string

  constructor() {
    super()
    this.visible = false
    this.toastType = 'success'
    this.message = 'Connection restored!'
  }

  protected override createRenderRoot() {
    // Render into the light DOM so Tailwind utility classes continue to work
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()

    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
    this.updateConnectionStatus()
  }

  override disconnectedCallback(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
      this.hideTimeout = null
    }

    super.disconnectedCallback()
  }

  private handleOnline = () => {
    this.showNotification('Connection restored!', 'success')
    this.updateConnectionStatus(true)
  }

  private handleOffline = () => {
    this.updateConnectionStatus(false)
  }

  private updateConnectionStatus(forceState?: boolean): void {
    if (typeof document === 'undefined') {
      return
    }

    const statusIndicator = queryConnectionStatusIndicator(document)
    if (!statusIndicator) {
      return
    }

    if (typeof navigator === 'undefined') {
      return
    }

    const isOnline = typeof forceState === 'boolean' ? forceState : navigator.onLine
    statusIndicator.textContent = isOnline ? 'Online' : 'Offline'
    statusIndicator.className = `connection-status ${isOnline ? 'text-green-600' : 'text-red-600'}`
  }

  public showNotification(message: string, type: ToastType = 'success'): void {
    this.message = message
    this.toastType = type
    this.visible = true

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
    }

    this.hideTimeout = setTimeout(() => {
      this.visible = false
      this.hideTimeout = null
    }, TOAST_HIDE_TIMEOUT)
  }

  private get toastClasses(): string {
    const baseClasses =
      'fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-(--z-content-floating) transition-all duration-300'
    return this.visible ? baseClasses : `${baseClasses} hidden`
  }

  private get announcementRole(): 'status' | 'alert' {
    return this.toastType === 'error' ? 'alert' : 'status'
  }

  private get announcementPoliteness(): 'polite' | 'assertive' {
    return this.toastType === 'error' ? 'assertive' : 'polite'
  }

  protected override render() {
    const canUseDocument = typeof document !== 'undefined'
    const successIconMarkup = canUseDocument
      ? queryNetworkStatusIconMarkup({
          iconBankId: ICON_BANK_ID,
          iconName: 'success',
          root: document,
        })
      : null
    const errorIconMarkup = canUseDocument
      ? queryNetworkStatusIconMarkup({
          iconBankId: ICON_BANK_ID,
          iconName: 'error',
          root: document,
        })
      : null

    return html`
      <div
        data-network-status-toast
        class="${this.toastClasses}"
        data-type="${this.toastType}"
        role="${this.announcementRole}"
        aria-live="${this.announcementPoliteness}"
        aria-atomic="true"
      >
        <div class="flex items-center space-x-2">
          <span class="success-icon">${successIconMarkup ? unsafeHTML(successIconMarkup) : null}</span>
          <span class="error-icon hidden">${errorIconMarkup ? unsafeHTML(errorIconMarkup) : null}</span>
          <span class="toast-message">${this.message}</span>
        </div>
      </div>
    `
  }
}

export const registerNetworkStatusToast = async (
  tagName = NetworkStatusToastElement.registeredName
): Promise<void> => {
  defineCustomElement(tagName, NetworkStatusToastElement)
}

export const webComponentModule: WebComponentModule<NetworkStatusToastElement> = {
  registeredName: NetworkStatusToastElement.registeredName,
  componentCtor: NetworkStatusToastElement,
  registerWebComponent: registerNetworkStatusToast,
}
