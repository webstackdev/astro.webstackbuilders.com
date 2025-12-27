import { LitElement } from 'lit'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { copyFromElement } from './utils'
import {
  getCopyToClipboardButton,
  getCopyToClipboardIcon,
  getCopyToClipboardSuccessIcon,
} from './selectors'

export class CopyToClipboardElement extends LitElement {
  static registeredName = 'copy-to-clipboard'

  private button!: HTMLButtonElement
  private copyIcon!: HTMLElement
  private successIcon!: HTMLElement
  private resetTimerId: number | undefined

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()

    const scheduleMicrotask = (callback: () => void) => {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(callback)
        return
      }

      void Promise.resolve().then(callback)
    }

    scheduleMicrotask(() => {
      this.cacheElements()
      this.bindEvents()
      this.resetIcons()
    })
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    if (this.resetTimerId) {
      window.clearTimeout(this.resetTimerId)
      this.resetTimerId = undefined
    }
  }

  private cacheElements(): void {
    this.button = getCopyToClipboardButton(this)
    this.copyIcon = getCopyToClipboardIcon(this)
    this.successIcon = getCopyToClipboardSuccessIcon(this)
  }

  private bindEvents(): void {
    if (!this.button.dataset['copyToClipboardListener']) {
      addButtonEventListeners(this.button, this.handleCopy, this)
      this.button.dataset['copyToClipboardListener'] = 'true'
    }
  }

  private readonly handleCopy = async (event: Event): Promise<void> => {
    const target = event.currentTarget
    if (!(target instanceof HTMLElement)) {
      return
    }

    try {
      const copiedText = await copyFromElement(target)
      if (copiedText === null) {
        return
      }

      this.dispatchEvent(
        new CustomEvent('clipboard-copy', {
          bubbles: true,
          detail: {
            text: copiedText,
          },
        })
      )

      this.showSuccess()
    } catch {
      // Intentionally ignore clipboard failures; consumers can observe lack of event.
    }
  }

  private resetIcons(): void {
    if (this.copyIcon) {
      this.copyIcon.removeAttribute('hidden')
    }
    if (this.successIcon) {
      this.successIcon.setAttribute('hidden', '')
    }
  }

  private showSuccess(): void {
    if (this.resetTimerId) {
      window.clearTimeout(this.resetTimerId)
    }

    if (this.copyIcon) {
      this.copyIcon.setAttribute('hidden', '')
    }
    if (this.successIcon) {
      this.successIcon.removeAttribute('hidden')
    }

    this.resetTimerId = window.setTimeout(() => {
      this.resetIcons()
    }, 1500)
  }
}

export const registerWebComponent = async (tagName = CopyToClipboardElement.registeredName) => {
  defineCustomElement(tagName, CopyToClipboardElement)
}

export const registerCopyToClipboard = registerWebComponent

export const webComponentModule: WebComponentModule<CopyToClipboardElement> = {
  registeredName: CopyToClipboardElement.registeredName,
  componentCtor: CopyToClipboardElement,
  registerWebComponent,
}
