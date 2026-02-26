import { LitElement, html } from 'lit'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

export type ContentVariant = 'overview' | 'deep-dive'

const normalizeSlug = (slug: string): string => slug.replace(/^\/+|\/+$/g, '')

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
	}

	declare currentVariant: ContentVariant
	declare slug: string

	constructor() {
		super()
		this.currentVariant = 'overview'
		this.slug = ''
	}

	protected override createRenderRoot() {
		return this
	}

	protected override render() {
		const isDeepDive = this.currentVariant === 'deep-dive'
		const overviewHref = buildVariantHref('overview', this.slug)
		const deepDiveHref = buildVariantHref('deep-dive', this.slug)
		const switchHref = isDeepDive ? overviewHref : deepDiveHref

		const overviewLabelClass = isDeepDive
			? 'text-sm text-content-offset content-switcher-label content-switcher-label--overview'
			: 'text-sm font-medium text-content-active content-switcher-label content-switcher-label--overview'

		const deepDiveLabelClass = isDeepDive
			? 'text-sm font-medium text-content-active content-switcher-label content-switcher-label--deep-dive'
			: 'text-sm text-content-offset content-switcher-label content-switcher-label--deep-dive'

		return html`
			<div class="flex items-center gap-3" role="radiogroup" aria-label="Content Variant">
				<a class="${overviewLabelClass}" id="v1-overview-label" href="${overviewHref}">Overview</a>

				<a
					href="${switchHref}"
					role="switch"
					aria-checked="${isDeepDive ? 'true' : 'false'}"
					aria-label="Toggle between Overview and Deep Dive"
					class="content-switcher-track group relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-trim-offset transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
					data-switcher-toggle
				>
					<span
						class="content-switcher-thumb pointer-events-none inline-block size-5 translate-x-0.5 rounded-full bg-page-base shadow-sm ring-0 transition-transform"
					></span>
				</a>

				<a class="${deepDiveLabelClass}" id="v1-deep-dive-label" href="${deepDiveHref}">Deep Dive</a>
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
