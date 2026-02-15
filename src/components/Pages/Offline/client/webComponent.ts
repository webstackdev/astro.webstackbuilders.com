import { LitElement, nothing } from 'lit'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { getSafeReturnToUrl } from './url'

/**
 * Client enhancer for the offline page retry button.
 */
export class OfflinePageClientElement extends LitElement {
  static registeredName = 'offline-page-client'

  private isBound = false

  public assignNavigation = (url: string): void => {
    window.location.assign(url)
  }

  public reloadPage = (): void => {
    window.location.reload()
  }

  protected override createRenderRoot() {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.bindRetryButton()
  }

  private bindRetryButton(): void {
    if (this.isBound || typeof document === 'undefined') {
      return
    }

    const retryButton = document.getElementById('offline-retry-button')
    if (!(retryButton instanceof HTMLButtonElement)) {
      return
    }

    addButtonEventListeners(retryButton, this.handleRetryClick)
    this.isBound = true
  }

  private handleRetryClick = (): void => {
    if (typeof window === 'undefined') {
      return
    }

    const returnToUrl = getSafeReturnToUrl(window.location.search, window.location.origin)

    if (returnToUrl) {
      this.assignNavigation(returnToUrl)
      return
    }

    this.reloadPage()
  }

  protected override render() {
    return nothing
  }
}

/**
 * Registers the offline page client element.
 */
export const registerOfflinePageClient = async (
  tagName = OfflinePageClientElement.registeredName
): Promise<void> => {
  defineCustomElement(tagName, OfflinePageClientElement)
}

export const webComponentModule: WebComponentModule<OfflinePageClientElement> = {
  registeredName: OfflinePageClientElement.registeredName,
  componentCtor: OfflinePageClientElement,
  registerWebComponent: registerOfflinePageClient,
}
