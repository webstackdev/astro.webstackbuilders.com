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
			<style>
				[data-image-dialog] {
					align-items: center;
					display: flex;
					inset: 0;
					justify-content: center;
					padding: 1rem;
					position: fixed;
					z-index: var(--z-modal);
				}

				[data-image-dialog][hidden] {
					display: none;
				}

				.content-image__backdrop {
					background: var(--color-content);
					inset: 0;
					opacity: 0.72;
					position: absolute;
				}

				.content-image__panel {
					align-items: center;
					background: var(--color-page-base);
					border: 1px solid var(--color-trim);
					border-radius: 1rem;
					display: flex;
					justify-content: center;
					max-height: calc(100vh - 2rem);
					max-width: min(92vw, 90rem);
					overflow: hidden;
					padding: 3rem 1rem 1rem;
					position: relative;
					width: 100%;
				}

				.content-image__close {
					align-items: center;
					background: transparent;
					border: 0;
					border-radius: 9999px;
					color: var(--color-icons);
					cursor: pointer;
					display: inline-flex;
					justify-content: center;
					padding: 0.35rem;
					position: absolute;
					right: 0.75rem;
					top: 0.75rem;
					transition:
						color 150ms ease;
				}

				.content-image__close::after {
					border: 2px solid transparent;
					border-radius: 0;
					content: '';
					inset: -0.25rem;
					opacity: 0;
					pointer-events: none;
					position: absolute;
					transition:
						opacity 150ms ease,
						border-color 150ms ease;
				}

				.content-image__close:hover,
				.content-image__close:focus-visible {
					color: var(--color-icons-active);
					outline: none;
				}

				.content-image__close:focus-visible::after {
					border-color: var(--color-spotlight);
					opacity: 1;
				}

				.content-image__modal-asset {
					display: block;
					height: auto;
					margin: 0 auto;
					max-height: calc(100vh - 6rem);
					max-width: 100%;
					object-fit: contain;
					width: auto;
				}

				@media (min-width: 768px) {
					[data-image-dialog] {
						padding: 2rem;
					}

					.content-image__panel {
						max-height: calc(100vh - 4rem);
						padding: 3.5rem 1.5rem 1.5rem;
					}

					.content-image__modal-asset {
						max-height: calc(100vh - 8rem);
					}
				}
			</style>

			<div
				data-image-dialog
				role="dialog"
				aria-modal="true"
				aria-label=${dialogLabel}
				?hidden=${!this.open}
			>
				<div class="content-image__backdrop" @click=${() => this.closeModal()}></div>

				<div class="content-image__panel">
					<button
						type="button"
						class="content-image__close"
						data-image-close
						aria-label="Close image dialog"
						@click=${() => this.closeModal()}
					>
						${closeIconMarkup ? unsafeHTML(closeIconMarkup) : null}
					</button>

					${this.open && this.imageSrc
						? html`<img
								class="content-image__modal-asset"
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
