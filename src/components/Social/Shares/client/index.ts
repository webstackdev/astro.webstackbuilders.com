import { LitElement, html } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { platforms, type SharePlatform, type ShareData } from '@components/Social/common'
import styles from '../index.module.css'
import { queryMetaDescription } from './selectors'

const COMPONENT_TAG_NAME = 'social-share-element'
const DEFAULT_NETWORKS = 'twitter,linkedin,bluesky,reddit,mastodon'
const DEFAULT_LABEL = 'Share:'
const MASTODON_MODAL_ID = 'mastodon-modal'

let socialShareInstanceCounter = 0

const PLATFORM_ICONS: Record<string, () => ReturnType<typeof html>> = {
  twitter: () =>
    html`<path
      d="M 25,4.9919786 C 24.000000,5.3877005 23.395722,5.3983957 22.625668,5.013369 23.620321,4.4144385 23.673797,3.986631 24.037433,2.8529412 23.096257,3.4090909 22.048128,3.815508 20.935829,4.0294118 20.058824,3.0882353 18.796791,2.5 17.406417,2.5 c -2.673797,0 -4.86631,2.1818182 -4.86631,4.855615 0,0.3850267 0.03209,0.7486631 0.106952,1.1122994 C 8.6149733,8.2540107 5.0320856,6.328877 2.6363636,3.3877005 2.2085561,4.1042781 1.9946524,4.9385027 1.9946524,5.8475936 c 0,1.6684492 0.855615,3.1550802 2.1390374,4.0320855 C 3.342246,9.8475936 2.5935829,9.6336898 1.9411765,9.2700535 v 0.064171 c 0,2.3529415 1.6684492,4.3101605 3.8930481,4.7486635 -0.7165775,0.213903 -1.4652406,0.213903 -2.2032086,0.08556 0.6203209,1.925134 2.4171123,3.336899 4.5454546,3.379679 C 6.1122995,19.184492 3.5347594,19.868984 1,19.569519 c 2.1390374,1.390374 4.7058824,2.181818 7.4545455,2.181818 8.9304815,0 13.8181815,-7.40107 13.8181815,-13.8288771 0,-0.2139038 0,-0.4278075 -0.02139,-0.6417112 0.962567,-0.6737968 2.096257,-1.3048129 2.737968,-2.2887701 z"
    />`,
  linkedin: () =>
    html`<g>
      <rect x="0.61849976" y="7.0660033" width="4.6762981" height="14.966028"></rect>
      <path
        d="M 2.85826,0 C 1.13393,0 0,1.11519 0,2.59586 0,4.04842 1.09645,5.19172 2.79266,5.19172 h 0.0375 c 1.76181,0 2.85825,-1.15267 2.84888,-2.59586 C 5.64154,1.11519 4.5826,0 2.85827,0 Z"
      ></path>
      <path
        d="m 18.06794,6.92542 c -2.6802,0 -4.35767,1.46193 -4.66692,2.49278 V 7.06599 H 8.14369 c 0.0656,1.24639 0,14.96603 0,14.96603 h 5.25733 v -8.08747 c 0,-0.45919 -0.0188,-0.90902 0.11245,-1.22764 0.35611,-0.89965 1.13393,-1.83678 2.53026,-1.83678 1.82741,0 2.65209,1.38695 2.65209,3.41116 v 7.74073 H 24 V 13.71027 C 24,9.08083 21.39477,6.92542 18.06794,6.92542 Z"
      ></path>
    </g>`,
  bluesky: () =>
    html`<path
      d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.038.416-.054-2.36.166-4.218 1.041-3.696 2.583.51 1.507 2.817 2.701 5.293 2.699 3.274-.003 5.093-1.7 5.093-1.7s1.819 1.697 5.093 1.7c2.476.002 4.783-1.192 5.294-2.699.521-1.542-1.337-2.417-3.697-2.583.14.016.28.034.415.054 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"
    />`,
  reddit: () =>
    html`<path
      d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"
    />`,
  mastodon: () =>
    html`<path
      d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"
    />`,
}

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
  }

  declare url: string
  declare title: string
  declare description: string
  declare layout: 'horizontal' | 'vertical'
  declare labelText: string
  declare socialNetworksAttr: string
  declare containerClass: string
  private labelId: string

  constructor() {
    super()
    this.url = ''
    this.title = ''
    this.description = ''
    this.layout = 'horizontal'
    this.labelText = DEFAULT_LABEL
    this.socialNetworksAttr = DEFAULT_NETWORKS
    this.containerClass = ''
    socialShareInstanceCounter += 1
    this.labelId = `social-share-label-${socialShareInstanceCounter}`
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
      'social-share__label text-sm font-semibold text-text-offset mr-2 self-center',
    ]
      .filter(Boolean)
      .join(' ')

    const hasLabelText = Boolean(this.labelText?.trim())

    return html`
      <div
        class="${containerClassList}"
        role="group"
        aria-labelledby=${ifDefined(hasLabelText ? this.labelId : undefined)}
        aria-label=${ifDefined(hasLabelText ? undefined : 'Share this content')}
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
    const icon = PLATFORM_ICONS[platform.id]?.()
    const buttonClassList = [
      styles.button,
      'social-share__button inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
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
          aria-haspopup=${ifDefined(isMastodon ? 'dialog' : undefined)}
          aria-controls=${ifDefined(isMastodon ? MASTODON_MODAL_ID : undefined)}
          data-platform="${platform.id}"
          data-share="${platform.id}"
          data-share-text="${shareText}"
          @click=${(event: Event) => this.handleShareClick(event, platform, shareText)}
        >
          ${icon
            ? html`<svg
                class="h-4 w-4 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                ${icon}
              </svg>`
            : null}
          <span class="hidden sm:inline">${platform.name}</span>
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
        ${icon
          ? html`<svg
              class="h-4 w-4 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              ${icon}
            </svg>`
          : null}
        <span class="hidden sm:inline">${platform.name}</span>
      </a>
    `
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
