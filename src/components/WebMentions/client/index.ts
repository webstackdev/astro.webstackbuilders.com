import { LitElement, html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { actions } from 'astro:actions'
import { defineCustomElement } from '@components/scripts/utils'
import { handleScriptError } from '@components/scripts/errors/handler'
import {
  isForbiddenClientActionError,
  normalizeClientActionError,
} from '@components/scripts/errors/actionClient'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import type { WebmentionDisplayItem, WebmentionsListResult } from '@actions/webmentions/@types'
import { queryWebMentionsIconMarkup } from './selectors'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

const webmentionsCache = new Map<string, WebmentionsListResult>()
const scriptName = 'WebMentionsElement'
const emptyWebmentionsResult: WebmentionsListResult = {
  likesCount: 0,
  mentions: [],
  repostsCount: 0,
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export class WebMentionsElement extends LitElement {
  static registeredName = 'web-mentions'

  static override properties = {
    facepileLimit: { type: Number, attribute: 'facepile-limit' },
    iconBankId: { type: String, attribute: 'icon-bank-id' },
    showFacepile: { type: Boolean, attribute: 'show-facepile' },
    url: { type: String, attribute: 'url' },
  }

  declare facepileLimit: number
  declare iconBankId: string
  declare showFacepile: boolean
  declare url: string

  private likesCount = 0
  private lastLoadedUrl = ''
  private mentions: WebmentionDisplayItem[] = []
  private repostsCount = 0
  private state: LoadState = 'idle'

  constructor() {
    super()
    this.facepileLimit = 5
    this.iconBankId = ''
    this.showFacepile = true
    this.url = ''
  }

  protected override createRenderRoot() {
    return this
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    void this.load()
  }

  protected override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('url')) {
      void this.load()
    }
  }

  private applyData(data: WebmentionsListResult): void {
    this.likesCount = data.likesCount
    this.mentions = [...data.mentions]
    this.repostsCount = data.repostsCount
    this.state = 'ready'
    this.requestUpdate()
  }

  private hasContent(): boolean {
    return this.mentions.length > 0 || this.likesCount > 0 || this.repostsCount > 0
  }

  private async load(): Promise<void> {
    const normalizedUrl = this.url.trim()
    if (!normalizedUrl) {
      this.lastLoadedUrl = ''
      this.state = 'error'
      this.requestUpdate()
      return
    }

    if (
      normalizedUrl === this.lastLoadedUrl &&
      (this.state === 'loading' || this.state === 'ready')
    ) {
      return
    }

    this.lastLoadedUrl = normalizedUrl

    const cached = webmentionsCache.get(normalizedUrl)
    if (cached) {
      this.applyData(cached)
      return
    }

    this.state = 'loading'
    this.requestUpdate()

    try {
      const { data, error } = await actions.webmentions.list({ url: normalizedUrl })
      const actionError = normalizeClientActionError(error)

      if (error || !data) {
        if (isForbiddenClientActionError(actionError)) {
          webmentionsCache.set(normalizedUrl, emptyWebmentionsResult)
          this.applyData(emptyWebmentionsResult)
          return
        }

        handleScriptError(error ?? new Error('Failed to load WebMentions data.'), {
          scriptName,
          operation: 'load',
        })

        if (this.lastLoadedUrl === normalizedUrl) {
          this.lastLoadedUrl = ''
        }
        this.state = 'error'
        this.requestUpdate()
        return
      }

      webmentionsCache.set(normalizedUrl, data)
      this.applyData(data)
    } catch (error) {
      const actionError = normalizeClientActionError(error)

      if (isForbiddenClientActionError(actionError)) {
        webmentionsCache.set(normalizedUrl, emptyWebmentionsResult)
        this.applyData(emptyWebmentionsResult)
        return
      }

      handleScriptError(error, { scriptName, operation: 'load' })

      if (this.lastLoadedUrl === normalizedUrl) {
        this.lastLoadedUrl = ''
      }
      this.state = 'error'
      this.requestUpdate()
    }
  }

  protected override render() {
    if (this.state !== 'ready' || !this.hasContent()) {
      return html``
    }

    const newestMentions = [...this.mentions].reverse()
    const facepileMentions = newestMentions.slice(0, this.facepileLimit).reverse()
    const heartIconMarkup = queryWebMentionsIconMarkup({
      iconBankId: this.iconBankId,
      iconName: 'heart-filled',
    })
    const repostIconMarkup = queryWebMentionsIconMarkup({
      iconBankId: this.iconBankId,
      iconName: 'background-broken',
    })

    return html`
      <section
        class="mt-12 pt-8 border-t border-trim"
        id="webmentions"
        aria-labelledby="webmentions-heading"
      >
        <header
          class="flex items-start justify-between mb-6 flex-wrap gap-4 flex-col sm:flex-row sm:items-center"
        >
          <h3 class="text-2xl font-bold m-0" id="webmentions-heading">Webmentions</h3>

          ${this.likesCount > 0 || this.repostsCount > 0
            ? html`
                <div class="flex gap-6 items-center w-full sm:w-auto justify-start">
                  ${this.likesCount > 0
                    ? html`
                        <span
                          class="inline-flex items-center gap-1.5 text-content-active text-sm font-medium"
                          title="${this.likesCount} like${this.likesCount === 1 ? '' : 's'}"
                          aria-label="${this.likesCount} like${this.likesCount === 1 ? '' : 's'}"
                        >
                          ${heartIconMarkup ? unsafeHTML(heartIconMarkup) : null} ${this.likesCount}
                        </span>
                      `
                    : null}
                  ${this.repostsCount > 0
                    ? html`
                        <span
                          class="inline-flex items-center gap-1.5 text-content-active text-sm font-medium"
                          title="${this.repostsCount} repost${this.repostsCount === 1 ? '' : 's'}"
                          aria-label="${this.repostsCount} repost${this.repostsCount === 1
                            ? ''
                            : 's'}"
                        >
                          ${repostIconMarkup ? unsafeHTML(repostIconMarkup) : null}
                          ${this.repostsCount}
                        </span>
                      `
                    : null}
                </div>
              `
            : null}
        </header>

        ${this.showFacepile && newestMentions.length > 0
          ? html`
              <div
                class="flex items-center gap-2 mb-6 p-4 bg-page-offset rounded-lg"
                role="group"
                aria-label="Recent mentions: ${newestMentions.length}"
              >
                ${facepileMentions.map(
                  mention => html`
                    <img
                      src="${mention.avatarUrl}"
                      alt="${mention.authorName}"
                      title="${mention.authorName}"
                      aria-hidden="true"
                      class="w-10 h-10 rounded-full border-2 border-bg object-cover transition-transform hover:scale-110 hover:z-(--z-raised)"
                      loading="lazy"
                      decoding="async"
                    />
                  `
                )}
                ${newestMentions.length > this.facepileLimit
                  ? html`
                      <span
                        class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-offset text-content-inverse text-xs font-semibold"
                        aria-label="${newestMentions.length -
                        this.facepileLimit} more mention${newestMentions.length -
                          this.facepileLimit ===
                        1
                          ? ''
                          : 's'}"
                      >
                        +${newestMentions.length - this.facepileLimit}
                      </span>
                    `
                  : null}
              </div>
            `
          : null}
        ${newestMentions.length > 0
          ? html`
              <ol class="list-none p-0 m-0 flex flex-col gap-6">
                ${newestMentions.map(
                  mention => html`
                    <li class="m-0">
                      <article
                        class="p-4 bg-page-offset rounded-lg border border-trim h-cite"
                        id="webmention-${mention.id}"
                      >
                        <div
                          class="flex items-start justify-between gap-4 mb-3 flex-wrap flex-col sm:flex-nowrap sm:flex-row sm:items-center"
                        >
                          <a
                            class="inline-flex items-center gap-3 no-underline transition-colors hover:text-primary-hover p-author h-card u-url"
                            href="${mention.authorUrl}"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src="${mention.avatarUrl}"
                              alt="${mention.authorName}"
                              aria-hidden="true"
                              class="w-10 h-10 rounded-full object-cover border-2 border-trim u-photo"
                              loading="lazy"
                              decoding="async"
                            />
                            <strong class="font-semibold p-name">${mention.authorName}</strong>
                          </a>

                          <time
                            class="text-content-active text-sm whitespace-nowrap dt-published"
                            datetime="${mention.published}"
                          >
                            ${formatDate(mention.published)}
                          </time>
                        </div>

                        ${mention.contentHtml
                          ? html`
                              <div
                                class="leading-relaxed wrap-break-word [&_p]:my-2 [&_a]:text-primary [&_a]:underline [&_a:hover]:text-primary-hover p-content"
                              >
                                ${unsafeHTML(mention.contentHtml)}
                              </div>
                            `
                          : null}
                      </article>
                    </li>
                  `
                )}
              </ol>
            `
          : null}
      </section>
    `
  }
}

export const registerWebMentionsComponent = async (
  tagName = WebMentionsElement.registeredName
): Promise<void> => {
  defineCustomElement(tagName, WebMentionsElement)
}

export const webComponentModule: WebComponentModule<WebMentionsElement> = {
  registeredName: WebMentionsElement.registeredName,
  componentCtor: WebMentionsElement,
  registerWebComponent: registerWebMentionsComponent,
}
