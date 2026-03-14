import { LitElement, html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { defineCustomElement } from '@components/scripts/utils/defineCustomElement'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
	getImageModalRoot,
	queryImageCloseButton,
	queryImageIconMarkup,
} from './selectors'

const COMPONENT_TAG_NAME = 'content-image'

const parseDimension = (value: string | null): number | undefined => {
	if (!value) {
		return undefined
	}

	const parsed = Number(value)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const isElement = (value: EventTarget | null): value is Element => value instanceof Element
const dialogClasses = 'fixed inset-0 z-(--z-modal) flex items-center justify-center p-4 md:p-8'
const backdropClasses = 'absolute inset-0 bg-content opacity-[0.72]'
const panelClasses =
	'relative flex w-full max-w-[min(92vw,90rem)] max-h-[calc(100vh-2rem)] items-center justify-center overflow-hidden rounded-2xl border border-trim bg-page-base px-4 pt-12 pb-4 md:max-h-[calc(100vh-4rem)] md:px-6 md:pt-14 md:pb-6'
const closeButtonClasses =
	"absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full border-0 bg-gray-200 p-0 text-icons transition-colors duration-150 ease-linear hover:text-icons-active focus-visible:text-icons-active focus-visible:outline-none after:pointer-events-none after:absolute after:content-[''] after:inset-0 after:rounded-none after:border-2 after:border-transparent after:opacity-0 after:transition-opacity after:duration-150 after:ease-out focus-visible:after:opacity-100 focus-visible:after:-inset-1 focus-visible:after:border-spotlight"
const modalAssetClasses =
	'mx-auto block h-auto max-h-[calc(100vh-6rem)] max-w-full w-auto object-contain md:max-h-[calc(100vh-8rem)]'

export class ImageElement extends LitElement {
	static registeredName = COMPONENT_TAG_NAME

	static override properties = {
		open: { type: Boolean, reflect: true },
		imageSrc: { type: String, attribute: 'image-src' },
		imageAlt: { type: String, attribute: 'image-alt' },
		imageWidth: { type: Number, attribute: 'image-width' },
		imageHeight: { type: Number, attribute: 'image-height' },
		iconBankId: { type: String, attribute: 'icon-bank-id' },
	}

	declare open: boolean
	declare imageSrc: string
	declare imageAlt: string
	declare imageWidth: number | undefined
	declare imageHeight: number | undefined
	declare iconBankId: string

	private opener: HTMLElement | null = null

	constructor() {
		super()
		this.open = false
		this.imageSrc = ''
		this.imageAlt = ''
		this.imageWidth = undefined
		this.imageHeight = undefined
		this.iconBankId = ''
	}

	protected override createRenderRoot(): HTMLElement | DocumentFragment {
		return getImageModalRoot(this) ?? this
	}

	public override connectedCallback(): void {
		super.connectedCallback()

		this.imageWidth = parseDimension(this.getAttribute('image-width'))
		this.imageHeight = parseDimension(this.getAttribute('image-height'))

		this.addEventListener('click', this.handleHostClick)
		document.addEventListener('keydown', this.handleKeyDown)
	}

	public override disconnectedCallback(): void {
		this.removeEventListener('click', this.handleHostClick)
		document.removeEventListener('keydown', this.handleKeyDown)
		super.disconnectedCallback()
	}

	private readonly handleHostClick = (event: Event): void => {
		if (!isElement(event.target)) {
			return
		}

		const openButton = event.target.closest('[data-image-open]')
		if (!openButton || !this.contains(openButton)) {
			return
		}

		event.preventDefault()
		this.opener = openButton instanceof HTMLElement ? openButton : null
		this.openModal()
	}

	private readonly handleKeyDown = (event: KeyboardEvent): void => {
		if (!this.open || event.key !== 'Escape') {
			return
		}

		event.preventDefault()
		this.closeModal()
	}

	private openModal(): void {
		if (!this.imageSrc) {
			return
		}

		this.open = true

		this.updateComplete
			.then(() => {
				const closeButton = queryImageCloseButton(this.renderRoot)
				if (closeButton) {
					closeButton.focus()
				}
			})
			.catch(() => {})
	}

	private closeModal(): void {
		if (!this.open) {
			return
		}

		this.open = false
		this.opener?.focus()
	}

	protected override render() {
		const closeIconMarkup =
			typeof document !== 'undefined'
				? queryImageIconMarkup({
						iconBankId: this.iconBankId,
						iconName: 'close',
						root: document,
					})
				: null

		const dialogLabel = this.imageAlt ? `Expanded view for ${this.imageAlt}` : 'Expanded image'

		return html`
			<div
				class=${dialogClasses}
				data-image-dialog
				role="dialog"
				aria-modal="true"
				aria-label=${dialogLabel}
				?hidden=${!this.open}
			>
				<div class=${backdropClasses} @click=${() => this.closeModal()}></div>

				<div class=${panelClasses}>
					<button
						type="button"
						class=${closeButtonClasses}
						data-image-close
						aria-label="Close image dialog"
						@click=${() => this.closeModal()}
					>
						${closeIconMarkup ? unsafeHTML(closeIconMarkup) : null}
					</button>

					${this.open && this.imageSrc
						? html`<img
								class=${modalAssetClasses}
								data-image-modal-asset
								src=${this.imageSrc}
								alt=${this.imageAlt}
								decoding="async"
								width=${this.imageWidth ?? ''}
								height=${this.imageHeight ?? ''}
							/>`
						: null}
				</div>
			</div>
		`
	}
}

export const registerWebComponent = (tagName = ImageElement.registeredName) => {
	if (typeof window === 'undefined') {
		return
	}

	defineCustomElement(tagName, ImageElement)
}

export const registerImageWebComponent = registerWebComponent

export const webComponentModule: WebComponentModule<ImageElement> = {
	registeredName: COMPONENT_TAG_NAME,
	componentCtor: ImageElement,
	registerWebComponent,
}
