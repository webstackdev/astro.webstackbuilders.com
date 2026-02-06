import { LitElement, css, html } from 'lit'
import type { PropertyValues, TemplateResult } from 'lit'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import type { EmbedPlatform } from '.'

const mediaPlatforms: EmbedPlatform[] = ['youtube', 'codepen']

export class SocialEmbedElement extends LitElement {
  static registeredName = 'social-embed'

  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }
  `

  static override properties = {
    url: { type: String },
    platform: { type: String },
  }

  declare url: string
  declare platform: EmbedPlatform | null | undefined

  constructor() {
    super()
    this.url = ''
  }

  protected override createRenderRoot() {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this.syncDataAttributes()
  }

  protected override willUpdate(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has('url') || changedProperties.has('platform')) {
      this.syncDataAttributes()
    }
  }

  private syncDataAttributes(): void {
    this.dataset['embed'] = ''

    if (this.url) {
      this.dataset['embedUrl'] = this.url
    } else {
      delete this.dataset['embedUrl']
    }

    if (this.platform) {
      this.dataset['embedPlatform'] = this.platform
    } else {
      delete this.dataset['embedPlatform']
    }
  }

  private get resolvedPlatform(): EmbedPlatform {
    return (this.platform as EmbedPlatform) || 'x'
  }

  private renderPlaceholder(): TemplateResult {
    const includeMedia = mediaPlatforms.includes(this.resolvedPlatform)

    return html`
      <p
        class="sr-only"
        data-embed-loading-status
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Loading embedded content.
      </p>
      <div
        data-embed-placeholder
        aria-hidden="true"
        class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm animate-pulse"
      >
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></div>
          <div class="flex-1 flex flex-col gap-2">
            <div class="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div class="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        <div class="mb-4 flex flex-col gap-2">
          <div class="h-3.5 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div class="h-3.5 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div class="h-3.5 w-[70%] bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        ${includeMedia
          ? html`<div
              class="w-full aspect-video bg-gray-300 dark:bg-gray-600 rounded-lg mb-4"
            ></div>`
          : null}
        <div class="flex gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    `
  }

  protected override render(): TemplateResult {
    if (this.resolvedPlatform === 'linkedin') {
      this.setAttribute('aria-busy', 'false')
      return html`<slot></slot>`
    }

    this.setAttribute('aria-busy', 'true')
    return this.renderPlaceholder()
  }
}

export const registerWebComponent = async (tagName = SocialEmbedElement.registeredName) => {
  defineCustomElement(tagName, SocialEmbedElement)
}

export const webComponentModule: WebComponentModule<SocialEmbedElement> = {
  registeredName: SocialEmbedElement.registeredName,
  componentCtor: SocialEmbedElement,
  registerWebComponent,
}
