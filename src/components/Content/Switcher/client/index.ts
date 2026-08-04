import { LitElement, html } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { queryPrefetchLink } from './selectors'

export type ContentVariant = 'overview' | 'deep-dive'

const prefetchedHrefs = new Set<string>()

const disabledLinkClasses = 'pointer-events-none cursor-not-allowed opacity-50'

const normalizeSlug = (slug: string): string => slug.replace(/^\/+|\/+$/g, '')

const queueIdlePrefetch = (work: () => void): void => {
  if (typeof window === 'undefined') {
    return
  }

  let hasRun = false
  const runOnce = () => {
    if (hasRun) {
      return
    }

    hasRun = true
    work()
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => runOnce())
    window.setTimeout(runOnce, 150)
    return
  }

  window.setTimeout(runOnce, 150)
}

const prefetchDocument = (href: string): void => {
  if (typeof document === 'undefined' || typeof window === 'undefined' || !href) {
    return
  }

  if (prefetchedHrefs.has(href)) {
    return
  }

  prefetchedHrefs.add(href)

  const existingLink = queryPrefetchLink(document.head, href)
  if (!existingLink) {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    document.head.append(link)
  }

  if (typeof window.fetch === 'function') {
    void window
      .fetch(href, {
        credentials: 'same-origin',
      })
      .catch(() => {
        /* Best-effort warmup only. */
      })
  }
}

/**
 * Builds a route href for a content variant and slug.
 */
const buildVariantHref = (variant: ContentVariant, slug: string): string => {
  const normalizedSlug = normalizeSlug(slug)

  if (variant === 'overview') {
    return normalizedSlug ? `/articles/${normalizedSlug}` : '/articles'
  }

  return normalizedSlug ? `/deep-dive/${normalizedSlug}` : '/deep-dive'
}

export class ContentSwitcherElement extends LitElement {
  static registeredName = 'content-switcher'

  static override properties = {
    currentVariant: { type: String, attribute: 'current-variant' },
    slug: { type: String },
    hasAlternate: {
      type: Boolean,
      attribute: 'has-alternate',
      /**
       * Astro renders boolean attributes as has-alternate="true" or
       * has-alternate="false", so the default Lit converter (attribute
       * presence) is not sufficient on its own.
       */
      converter: {
        fromAttribute: (value: string | null) => value !== null && value !== 'false',
      },
    },
  }

  declare currentVariant: ContentVariant
  declare slug: string
  declare hasAlternate: boolean

  constructor() {
    super()
    this.currentVariant = 'overview'
    this.slug = ''
    this.hasAlternate = false
  }

  protected override createRenderRoot() {
    return this
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.prefetchAlternateVariant()
  }

  protected override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('currentVariant') || changedProperties.has('slug')) {
      this.prefetchAlternateVariant()
    }
  }

  private prefetchAlternateVariant(): void {
    if (!this.hasAlternate) {
      return
    }

    const alternateVariant = this.currentVariant === 'deep-dive' ? 'overview' : 'deep-dive'
    const href = buildVariantHref(alternateVariant, this.slug)

    queueIdlePrefetch(() => {
      prefetchDocument(href)
    })
  }

  protected override render() {
    const isDeepDive = this.currentVariant === 'deep-dive'
    const overviewHref = buildVariantHref('overview', this.slug)
    const deepDiveHref = buildVariantHref('deep-dive', this.slug)
    const switchHref = isDeepDive ? overviewHref : deepDiveHref

    /**
     * When the alternate variant route does not exist, its label link and the
     * toggle are rendered inert so visitors cannot navigate to a 404 page.
     */
    const overviewLinkDisabled = !this.hasAlternate && isDeepDive
    const deepDiveLinkDisabled = !this.hasAlternate && !isDeepDive

    const commonLabelClasses = 'text-xs no-underline hover:no-underline focus-visible:no-underline'

    const overviewLabelClass =
      (isDeepDive
        ? 'content-switcher-label content-switcher-label--overview text-content-offset hover:text-content' +
          ' ' +
          commonLabelClasses
        : 'content-switcher-label content-switcher-label--overview text-page-inverse' +
          ' ' +
          commonLabelClasses) + (overviewLinkDisabled ? ' ' + disabledLinkClasses : '')

    const deepDiveLabelClass =
      (isDeepDive
        ? 'content-switcher-label content-switcher-label--deep-dive text-page-inverse' +
          ' ' +
          commonLabelClasses
        : 'content-switcher-label content-switcher-label--deep-dive text-content-offset hover:text-content' +
          ' ' +
          commonLabelClasses) + (deepDiveLinkDisabled ? ' ' + disabledLinkClasses : '')

    const switchTrackClass =
      'content-switcher-track group relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-page-inverse transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary' +
      (this.hasAlternate ? '' : ' ' + disabledLinkClasses)

    return html`
      <div class="flex items-center gap-3" role="radiogroup" aria-label="Content Variant">
        <a
          class="${overviewLabelClass}"
          id="overview-label"
          href="${ifDefined(overviewLinkDisabled ? undefined : overviewHref)}"
          aria-disabled="${overviewLinkDisabled ? 'true' : 'false'}"
          >Overview</a
        >

        <a
          href="${ifDefined(this.hasAlternate ? switchHref : undefined)}"
          role="switch"
          aria-checked="${isDeepDive ? 'true' : 'false'}"
          aria-disabled="${this.hasAlternate ? 'false' : 'true'}"
          aria-label="Toggle between Overview and Deep Dive"
          class="${switchTrackClass}"
          data-switcher-toggle
        >
          <span
            class="content-switcher-thumb pointer-events-none inline-block size-3 -translate-x-1.25 rounded-full bg-page-base shadow-sm ring-0 transition-transform"
          ></span>
        </a>

        <a
          class="${deepDiveLabelClass}"
          id="deep-dive-label"
          href="${ifDefined(deepDiveLinkDisabled ? undefined : deepDiveHref)}"
          aria-disabled="${deepDiveLinkDisabled ? 'true' : 'false'}"
          >Deep Dive</a
        >
      </div>
    `
  }
}

export const registerWebComponent = async (tagName = ContentSwitcherElement.registeredName) => {
  defineCustomElement(tagName, ContentSwitcherElement)
}

export const registerContentSwitcherComponent = registerWebComponent

export const webComponentModule: WebComponentModule<ContentSwitcherElement> = {
  registeredName: ContentSwitcherElement.registeredName,
  componentCtor: ContentSwitcherElement,
  registerWebComponent,
}
