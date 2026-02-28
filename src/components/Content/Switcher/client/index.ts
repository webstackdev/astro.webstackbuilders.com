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

    const commonLabelClasses = 'text-xs no-underline hover:no-underline focus-visible:no-underline'

		const overviewLabelClass = isDeepDive
			? 'content-switcher-label content-switcher-label--overview text-content-offset hover:text-content' + ' ' + commonLabelClasses
			: 'content-switcher-label content-switcher-label--overview text-page-inverse' + ' ' + commonLabelClasses

		const deepDiveLabelClass = isDeepDive
			? 'content-switcher-label content-switcher-label--deep-dive text-page-inverse' + ' ' + commonLabelClasses
			: 'content-switcher-label content-switcher-label--deep-dive text-content-offset hover:text-content' + ' ' + commonLabelClasses

		return html`
			<div class="flex items-center gap-3" role="radiogroup" aria-label="Content Variant">
				<a class="${overviewLabelClass}" id="overview-label" href="${overviewHref}">Overview</a>

				<a
					href="${switchHref}"
					role="switch"
					aria-checked="${isDeepDive ? 'true' : 'false'}"
					aria-label="Toggle between Overview and Deep Dive"
					class="content-switcher-track group relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-trim-offset transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
					data-switcher-toggle
				>
					<span class="content-switcher-thumb pointer-events-none inline-block size-3 -translate-x-1.25 rounded-full bg-page-base shadow-sm ring-0 transition-transform"></span>
				</a>

				<a class="${deepDiveLabelClass}" id="deep-dive-label" href="${deepDiveHref}">Deep Dive</a>
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
