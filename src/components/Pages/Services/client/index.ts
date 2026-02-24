import { LitElement, nothing } from 'lit'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { queryServiceContactLinks } from './selectors'

/**
 * Services page web component wrapper.
 * Uses light DOM so Astro-rendered markup remains directly accessible.
 */
export class ServicesPageElement extends LitElement {
	static registeredName = 'services-page'
	private static readonly contactPath = '/contact'

	private static buildContactHref(accountType: string): string {
		const normalizedAccountType = accountType.trim()
		if (!normalizedAccountType) {
			return ServicesPageElement.contactPath
		}

		return `${ServicesPageElement.contactPath}?type=${encodeURIComponent(normalizedAccountType)}`
	}

	override connectedCallback() {
		super.connectedCallback()
		this.syncContactLinks()
	}

	private syncContactLinks(): void {
		const links = queryServiceContactLinks(this)

		for (const link of links) {
			const accountType = link.dataset['accountType'] ?? ''
			link.setAttribute('href', ServicesPageElement.buildContactHref(accountType))
		}
	}

	protected override createRenderRoot() {
		return this
	}

	protected override render() {
		return nothing
	}
}

export const registerServicesPageWebComponent = async (
	tagName = ServicesPageElement.registeredName
): Promise<void> => {
	defineCustomElement(tagName, ServicesPageElement)
}

export const registerWebComponent = registerServicesPageWebComponent

export const webComponentModule: WebComponentModule<ServicesPageElement> = {
	registeredName: ServicesPageElement.registeredName,
	componentCtor: ServicesPageElement,
	registerWebComponent,
}
