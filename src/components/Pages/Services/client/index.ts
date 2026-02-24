import { LitElement, nothing } from 'lit'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

/**
 * Services page web component wrapper.
 * Uses light DOM so Astro-rendered markup remains directly accessible.
 */
export class ServicesPageElement extends LitElement {
	static registeredName = 'services-page'

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
