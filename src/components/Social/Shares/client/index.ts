import { LitElement, html, nothing } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { platforms, type SharePlatform, type ShareData } from '@components/Social/common'
import styles from '../index.module.css'
import { queryMetaDescription, querySocialShareIconMarkup } from './selectors'

const COMPONENT_TAG_NAME = 'social-share-element'
const DEFAULT_NETWORKS = 'x,linkedin,bluesky,reddit,mastodon'
const DEFAULT_LABEL = 'Share:'
const MASTODON_MODAL_ID = 'mastodon-modal'

let socialShareInstanceCounter = 0

export class SocialShareElement extends LitElement {
  static registeredName = COMPONENT_TAG_NAME

  static override properties = {
    url: { type: String },
    title: { type: String },
    description: { type: String },
    layout: { type: String },
    labelText: { type: String, attribute: 'label-text' },
    socialNetworksAttr: { type: String, attribute: 'social-networks' },
    containerClass: { type: String, attribute: 'container-class' },
    iconBankId: { type: String, attribute: 'icon-bank-id' },
  }

  declare url: string
  declare title: string
  declare description: string
  declare layout: 'horizontal' | 'vertical'
  declare labelText: string
  declare socialNetworksAttr: string
  declare containerClass: string
  declare iconBankId: string
  private labelId: string
  private iconMarkupCache: Map<string, string>

  constructor() {
    super()
    this.url = ''
    this.title = ''
    this.description = ''
    this.layout = 'horizontal'
    this.labelText = DEFAULT_LABEL
    this.socialNetworksAttr = DEFAULT_NETWORKS
    this.containerClass = ''
    this.iconBankId = ''
    socialShareInstanceCounter += 1
    this.labelId = `social-share-label-${socialShareInstanceCounter}`
    this.iconMarkupCache = new Map()
  }

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  protected override render() {
    const shareData = this.getShareData()
    const shareText = `${shareData.text} ${shareData.url}`.trim()
    const containerClassList = [
      styles.container,
      'social-share',
      this.layout === 'vertical' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-3',
      this.containerClass,
    ]
      .filter(Boolean)
      .join(' ')

    const labelClassList = [
      styles.label,
      'social-share__label text-sm font-semibold text-content-active mr-2 self-center',
    ]
      .filter(Boolean)
      .join(' ')

    const hasLabelText = Boolean(this.labelText?.trim())

    return html`
      <div
        class="${containerClassList}"
        role="group"
        aria-labelledby=${hasLabelText ? this.labelId : nothing}
        aria-label=${hasLabelText ? nothing : 'Share this content'}
      >
        <span id=${this.labelId} class="${labelClassList}">${this.labelText}</span>
        ${this.selectedPlatforms.map(platform =>
          this.renderPlatform(platform, shareData, shareText)
        )}
      </div>
    `
  }

  private get selectedPlatforms(): SharePlatform[] {
    const requestedNetworks = this.socialNetworksAttr
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)

    const filterList =
      requestedNetworks.length > 0 ? requestedNetworks : DEFAULT_NETWORKS.split(',')

    return platforms.filter(platform => filterList.includes(platform.id))
  }

  private getShareData(): ShareData {
    const trimmedDescription = this.description?.trim() ?? ''
    const text = trimmedDescription ? `${this.title} - ${trimmedDescription}` : this.title

    return {
      text,
      url: this.url,
      title: this.title,
    }
  }

  private renderPlatform(platform: SharePlatform, shareData: ShareData, shareText: string) {
    const iconMarkup = this.getIconMarkup(platform.icon || platform.id)
    const displayName = platform.id === 'x' ? 'X.com' : platform.name
    const buttonClassList = [
      styles.button,
      'social-share__button inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:shadow-md no-underline hover:no-underline',
      platform.colorClasses,
    ]
      .filter(Boolean)
      .join(' ')

    if (platform.useModal) {
      const isMastodon = platform.id === 'mastodon'
      return html`
        <button
          type="button"
          class="${buttonClassList}"
          aria-label="${platform.ariaLabel}"
          aria-haspopup=${isMastodon ? 'dialog' : nothing}
          aria-controls=${isMastodon ? MASTODON_MODAL_ID : nothing}
          data-platform="${platform.id}"
          data-share="${platform.id}"
          data-share-text="${shareText}"
          @click=${(event: Event) => this.handleShareClick(event, platform, shareText)}
        >
          ${iconMarkup ? unsafeHTML(iconMarkup) : null}
          <span class="hidden sm:inline">${displayName}</span>
        </button>
      `
    }

    const shareUrl = platform.getShareUrl(shareData)

    return html`
      <a
        href="${shareUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="${buttonClassList}"
        aria-label="${platform.ariaLabel}"
        data-share="${platform.id}"
        @click=${(event: Event) => this.handleShareClick(event, platform, shareText)}
      >
        ${iconMarkup ? unsafeHTML(iconMarkup) : null}
        <span class="hidden sm:inline">${displayName}</span>
      </a>
    `
  }

  private getIconMarkup(iconName: string): string | null {
    if (!iconName) {
      return null
    }

    const cached = this.iconMarkupCache.get(iconName)
    if (typeof cached === 'string') {
      return cached
    }

    if (typeof document === 'undefined' || !this.iconBankId) {
      return null
    }

    const markup = querySocialShareIconMarkup({
      iconBankId: this.iconBankId,
      iconName,
      root: document,
    })
    if (!markup) {
      return null
    }

    this.iconMarkupCache.set(iconName, markup)
    return markup
  }

  private handleShareClick(event: Event, platform: SharePlatform, shareText: string): void {
    const context = { scriptName: 'SocialShareElement', operation: 'handleShareClick' }
    addScriptBreadcrumb(context)

    try {
      this.trackShare(this.extractMethod(platform))

      if (platform.useModal) {
        event.preventDefault()
        this.openMastodonModal(shareText)
        return
      }

      if (
        event instanceof MouseEvent &&
        event.shiftKey &&
        typeof navigator !== 'undefined' &&
        navigator.share
      ) {
        event.preventDefault()
        const description = this.getMetaDescription()
        navigator
          .share({
            title: document.title,
            text: description,
            url: window.location.href,
          })
          .catch(error => {
            handleScriptError(error, { scriptName: 'SocialShareElement', operation: 'nativeShare' })
          })
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private trackShare(method?: string): void {
    if (typeof window === 'undefined') {
      return
    }

    const windowWithGtag = window as typeof window & {
      gtag?: (_command: string, _action: string, _parameters: Record<string, unknown>) => void
    }

    if (typeof windowWithGtag.gtag === 'function') {
      windowWithGtag.gtag('event', 'share', {
        method,
        contentType: 'article',
        contentId: window.location.pathname,
      })
    }
  }

  private extractMethod(platform: SharePlatform): string | undefined {
    const label = platform.ariaLabel
    if (!label) {
      return undefined
    }

    return label.replace(/^Share on\s+/i, '').toLowerCase()
  }

  private openMastodonModal(text: string): void {
    if (typeof window === 'undefined') {
      return
    }

    const mastodonModal = (window as Window & { openMastodonModal?: (_text: string) => void })
      .openMastodonModal
    if (typeof mastodonModal === 'function') {
      mastodonModal(text)
    }
  }

  private getMetaDescription(): string {
    if (typeof document === 'undefined') {
      return ''
    }

    return queryMetaDescription()?.content ?? ''
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'social-share-element': SocialShareElement
  }
}

export const registerSocialShareElement = (tagName = SocialShareElement.registeredName) => {
  if (typeof window === 'undefined') {
    return
  }

  defineCustomElement(tagName, SocialShareElement)
}

export const webComponentModule: WebComponentModule<SocialShareElement> = {
  registeredName: SocialShareElement.registeredName,
  componentCtor: SocialShareElement,
  registerWebComponent: registerSocialShareElement,
}

export const registerSocialShareWebComponent = registerSocialShareElement
