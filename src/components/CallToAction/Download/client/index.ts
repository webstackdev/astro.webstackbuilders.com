import { LitElement } from 'lit'
import {
  getEmailCollectionSnapshot,
  subscribeToEmailCollection,
  type EmailCollectionState,
} from '@components/scripts/store'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { getDownloadCtaPrimaryLink, getDownloadCtaUrls } from './selectors'

const scriptName = 'DownloadCtaElement'

export class DownloadCtaElement extends LitElement {
  static registeredName = 'download-cta'

  private primaryLink: HTMLAnchorElement | null = null
  private unsubscribeFromEmailCollection: (() => void) | null = null
  private isInitialized = false

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()

    queueMicrotask(() => {
      this.initialize()
    })
  }

  override disconnectedCallback(): void {
    this.unsubscribeFromEmailCollection?.()
    this.unsubscribeFromEmailCollection = null
    this.isInitialized = false
    super.disconnectedCallback()
  }

  public initialize(): void {
    const context = { scriptName, operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      if (this.isInitialized) {
        return
      }

      this.primaryLink = getDownloadCtaPrimaryLink(this)
      const { landingUrl, directDownloadUrl } = getDownloadCtaUrls(this)

      this.syncPrimaryLink(getEmailCollectionSnapshot(), {
        landingUrl,
        directDownloadUrl,
      })

      this.unsubscribeFromEmailCollection = subscribeToEmailCollection(state => {
        this.syncPrimaryLink(state, {
          landingUrl,
          directDownloadUrl,
        })
      })

      this.isInitialized = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private syncPrimaryLink(
    state: EmailCollectionState,
    urls: { landingUrl: string; directDownloadUrl: string }
  ): void {
    if (!this.primaryLink) {
      return
    }

    const hasProvidedEmail = state.hasProvidedEmail === true
    const nextHref = hasProvidedEmail ? urls.directDownloadUrl : urls.landingUrl
    const nextState = hasProvidedEmail ? 'ready' : 'gated'

    this.primaryLink.href = nextHref
    this.primaryLink.dataset['emailState'] = nextState
    this.dataset['emailState'] = nextState
  }
}

export const registerDownloadCtaWebComponent = (tagName = DownloadCtaElement.registeredName) => {
  if (typeof window === 'undefined') {
    return
  }

  defineCustomElement(tagName, DownloadCtaElement)
}

export const registerWebComponent = registerDownloadCtaWebComponent

export const webComponentModule: WebComponentModule<DownloadCtaElement> = {
  registeredName: DownloadCtaElement.registeredName,
  componentCtor: DownloadCtaElement,
  registerWebComponent: registerDownloadCtaWebComponent,
}
