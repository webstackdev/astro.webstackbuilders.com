import { LitElement, html } from 'lit'
import { createFocusTrap, type FocusTrap } from 'focus-trap'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  saveMastodonInstance,
  setCurrentMastodonInstance,
  getCurrentMastodonInstance,
  subscribeMastodonInstances,
} from '@components/scripts/store/mastodonInstances'
import { buildShareUrl } from './config'
import { getUrlDomain, isMastodonInstance, normalizeURL } from './detector'
import { getMastodonModalElement, queryMastodonInstanceInput } from './selectors'

const COMPONENT_TAG_NAME = 'mastodon-modal-element'

declare global {
  interface WindowEventMap {
    'mastodon:modal-open': CustomEvent<{ text: string }>
    'mastodon:modal-close': CustomEvent<void>
    'mastodon:share': CustomEvent<{ instance: string; text: string; url: string }>
    'mastodon:open-modal': CustomEvent<{ text: string }>
  }

  interface Window {
    openMastodonModal?: (_text: string) => void
  }
}

const dispatchOpenModal = (text: string) => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent('mastodon:open-modal', {
      detail: { text },
    })
  )
}

if (typeof window !== 'undefined') {
  window.openMastodonModal = dispatchOpenModal
}

export class MastodonModalElement extends LitElement {
  static registeredName = COMPONENT_TAG_NAME

  static override properties = {
    modalId: { type: String, attribute: 'modal-id' },
    open: { type: Boolean, reflect: true },
    shareText: { type: String, attribute: false },
    instanceValue: { type: String, attribute: false },
    rememberInstance: { type: Boolean, attribute: false },
    savedInstances: { attribute: false },
    statusMessage: { type: String, attribute: false },
    statusType: { type: String, attribute: false },
    isSubmitting: { type: Boolean, attribute: false },
  }

  declare modalId: string
  declare open: boolean
  declare shareText: string
  declare instanceValue: string
  declare rememberInstance: boolean
  declare statusMessage: string
  declare statusType: 'error' | 'success' | ''
  declare isSubmitting: boolean
  declare protected savedInstances: string[]

  private focusTrap: FocusTrap | null = null
  private unsubscribeSavedInstances: (() => void) | null = null
  private closeTimeout: ReturnType<typeof setTimeout> | null = null

  constructor() {
    super()
    this.modalId = 'mastodon-modal'
    this.open = false
    this.shareText = ''
    this.instanceValue = ''
    this.rememberInstance = false
    this.savedInstances = []
    this.statusMessage = ''
    this.statusType = ''
    this.isSubmitting = false
  }

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  public override connectedCallback(): void {
    super.connectedCallback()

    if (typeof window !== 'undefined') {
      window.addEventListener('mastodon:open-modal', this.handleExternalOpen)
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.handleKeyDown)
    }

    this.unsubscribeSavedInstances = subscribeMastodonInstances(this.handleSavedInstances)
  }

  public override disconnectedCallback(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mastodon:open-modal', this.handleExternalOpen)
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.handleKeyDown)
    }

    if (this.unsubscribeSavedInstances) {
      this.unsubscribeSavedInstances()
      this.unsubscribeSavedInstances = null
    }

    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout)
      this.closeTimeout = null
    }

    super.disconnectedCallback()
  }

  protected override firstUpdated(): void {
    const context = { scriptName: 'MastodonModalElement', operation: 'firstUpdated' }
    addScriptBreadcrumb(context)

    try {
      const modal = getMastodonModalElement(this, this.modalId)

      this.focusTrap = createFocusTrap(modal, {
        escapeDeactivates: true,
        clickOutsideDeactivates: true,
        onDeactivate: () => this.closeModal(true),
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private readonly handleExternalOpen = (event: CustomEvent<{ text: string }>): void => {
    this.openModal(event.detail.text)
  }

  private readonly handleSavedInstances = (instances: Set<string>): void => {
    this.savedInstances = [...instances]
    if (!this.instanceValue && this.savedInstances.length > 0) {
      const [firstSaved] = this.savedInstances
      if (firstSaved) {
        this.instanceValue = firstSaved
      }
    }
    this.requestUpdate()
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.open || event.key !== 'Escape') {
      return
    }
    event.preventDefault()
    this.closeModal()
  }

  public openModal(text: string): void {
    const context = { scriptName: 'MastodonModalElement', operation: 'openModal' }
    addScriptBreadcrumb(context)

    try {
      this.shareText = text
      this.open = true
      this.statusMessage = ''
      this.statusType = ''
      this.isSubmitting = false
      this.rememberInstance = false

      const savedInstance = getCurrentMastodonInstance() ?? this.savedInstances.at(0) ?? ''
      if (savedInstance) {
        this.instanceValue = savedInstance
      }

      this.updateComplete
        .then(() => {
          this.focusTrap?.activate()
          queryMastodonInstanceInput(this)?.focus()
        })
        .catch(error => {
          handleScriptError(error, context)
        })

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('mastodon:modal-open', {
            detail: { text },
          })
        )
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private closeModal(skipTrap = false): void {
    if (!this.open) {
      return
    }

    if (!skipTrap) {
      this.focusTrap?.deactivate()
    }

    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout)
      this.closeTimeout = null
    }

    this.open = false
    this.statusMessage = ''
    this.statusType = ''
    this.isSubmitting = false
    this.rememberInstance = false

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mastodon:modal-close'))
    }
  }

  private showStatus(message: string, type: 'error' | 'success' = 'error'): void {
    this.statusMessage = message
    this.statusType = type
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault()
    const context = { scriptName: 'MastodonModalElement', operation: 'handleSubmit' }
    addScriptBreadcrumb(context)

    try {
      const instance = this.instanceValue?.trim()
      if (!instance) {
        this.showStatus('Please enter a Mastodon instance')
        return
      }

      this.isSubmitting = true
      this.showStatus('Detecting instance...', 'success')

      const isValidInstance = await isMastodonInstance(instance)
      if (!isValidInstance) {
        this.showStatus('This does not appear to be a Mastodon instance')
        this.isSubmitting = false
        return
      }

      if (this.rememberInstance) {
        const domain = getUrlDomain(normalizeURL(instance))
        saveMastodonInstance(domain)
      }

      setCurrentMastodonInstance(instance)
      const shareUrl = buildShareUrl(instance, this.shareText)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('mastodon:share', {
            detail: { instance, text: this.shareText, url: shareUrl },
          })
        )
        window.open(shareUrl, '_blank', 'noopener,noreferrer')
      }

      this.showStatus('Opening Mastodon...', 'success')
      this.isSubmitting = false
      this.closeTimeout = setTimeout(() => this.closeModal(), 1000)
    } catch (error) {
      handleScriptError(error, context)
      this.showStatus('Failed to verify instance. Please try again.')
      this.isSubmitting = false
    }
  }

  private handleBackdropClick(event: Event): void {
    event.preventDefault()
    this.closeModal()
  }

  private handleSavedInstanceClick(instance: string): void {
    this.instanceValue = instance
  }

  private handleRememberChange(event: Event): void {
    const target = event.target
    if (target instanceof HTMLInputElement) {
      this.rememberInstance = target.checked
    }
  }

  private handleInstanceInput(event: Event): void {
    const target = event.target
    if (target instanceof HTMLInputElement) {
      this.instanceValue = target.value
    }
  }

  protected override render() {
    const modalTitleId = `${this.modalId}-title`
    const instanceHintId = `${this.modalId}-instance-hint`

    return html`
      <div
        id=${this.modalId}
        class="fixed inset-0 z-9999 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby=${modalTitleId}
        ?hidden=${!this.open}
      >
        <div
          class="modal-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click=${(event: Event) => this.handleBackdropClick(event)}
        ></div>
        <div
          class="modal-content relative w-full max-w-2xl max-h-[90vh] overflow-auto bg-content-inverse rounded-lg shadow-2xl"
        >
          <div class="flex items-center justify-between p-6 border-b border-trim">
            <h2 id=${modalTitleId} class="m-0 text-xl font-semibold">Share to Mastodon</h2>
            <button
              type="button"
              class="modal-close flex items-center justify-center w-8 h-8 p-0 border-0 bg-transparent rounded text-content-muted cursor-pointer transition-all duration-150 hover:bg-content-inverse-muted hover:text-content"
              aria-label="Close modal"
              @click=${() => this.closeModal()}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form
            id="mastodon-share-form"
            class="flex flex-col gap-6 p-6"
            @submit=${(event: Event) => this.handleSubmit(event)}
          >
            <div class="flex flex-col gap-2">
              <label for="share-text" class="font-medium">Text to share</label>
              <textarea
                id="share-text"
                name="text"
                rows="4"
                readonly
                class="w-full p-3 border border-trim rounded-md bg-content-inverse-muted font-[inherit] text-sm leading-6 resize-y focus:outline-2 focus:outline-primary focus:outline-offset-2"
                .value=${this.shareText}
              ></textarea>
            </div>

            <div class="flex flex-col gap-4">
              <label for="mastodon-instance" class="flex flex-col gap-2 font-medium">
                <span>Mastodon Instance</span>
                <span id=${instanceHintId} class="sr-only"
                  >Enter only the domain, without https://</span
                >
                <div
                  class="flex items-stretch border border-trim rounded-md overflow-hidden bg-content-inverse-input focus-within:outline-2 focus-within:outline-primary focus-within:outline-offset-2"
                >
                  <span
                    class="flex items-center px-3 py-2 bg-content-inverse-muted text-content-muted text-sm select-none"
                    aria-hidden="true"
                  >
                    https://
                  </span>
                  <input
                    type="text"
                    id="mastodon-instance"
                    name="instance"
                    placeholder="mastodon.social"
                    required
                    aria-describedby=${instanceHintId}
                    class="flex-1 min-w-0 px-3 py-2 border-0 bg-transparent text-base text-content focus:outline-none"
                    .value=${this.instanceValue}
                    @input=${(event: Event) => this.handleInstanceInput(event)}
                  />
                </div>
              </label>

              ${this.savedInstances.length > 0
                ? html`<div id="saved-instances" class="flex flex-col gap-2">
                    <p class="m-0 text-sm font-medium text-content-muted">Previously used:</p>
                    <div class="saved-list flex flex-wrap gap-2">
                      ${this.savedInstances.map(
                        instance =>
                          html`<button
                            type="button"
                            class="saved-instance"
                            @click=${() => this.handleSavedInstanceClick(instance)}
                          >
                            ${instance}
                          </button>`
                      )}
                    </div>
                  </div>`
                : null}

              <label for="remember-instance" class="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  id="remember-instance"
                  name="remember"
                  class="w-4 h-4 cursor-pointer"
                  .checked=${this.rememberInstance}
                  @change=${(event: Event) => this.handleRememberChange(event)}
                />
                <span>Remember this instance</span>
              </label>
            </div>

            <div class="flex gap-3 justify-end">
              <button
                type="button"
                class="btn-secondary modal-cancel px-4 py-2 border border-trim rounded-md font-medium cursor-pointer transition-all duration-150 bg-transparent text-content hover:bg-content-inverse-muted"
                @click=${() => this.closeModal()}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn-primary px-4 py-2 border-0 rounded-md font-medium cursor-pointer transition-all duration-150 bg-spotlight text-white hover:bg-primary-offset disabled:opacity-50 disabled:cursor-not-allowed"
                ?disabled=${this.isSubmitting}
              >
                Share
              </button>
            </div>

            <p
              class="modal-status m-0 text-sm text-center ${this.statusType}"
              role=${this.statusType === 'error' ? 'alert' : 'status'}
              aria-live=${this.statusType === 'error' ? 'assertive' : 'polite'}
              aria-atomic="true"
            >
              ${this.statusMessage}
            </p>
          </form>
        </div>
      </div>
      <style>
        .saved-list :global(.saved-instance) {
          background: var(--color-page-base-offset);
          border: 1px solid var(--color-border);
          border-radius: 0.25rem;
          color: var(--color-primary);
          cursor: pointer;
          font-size: 0.875rem;
          padding: 0.25rem 0.5rem;
          transition: all 0.15s ease;
        }

        .saved-list :global(.saved-instance:hover) {
          background: var(--color-primary);
          color: var(--color-page-base);
        }

        .modal-status.error {
          color: var(--color-error);
        }

        .modal-status.success {
          color: var(--color-success);
        }
      </style>
    `
  }
}

export const MastodonModal = {
  openModal(text: string) {
    dispatchOpenModal(text)
  },
}

export const registerWebComponent = (tagName = MastodonModalElement.registeredName) => {
  if (typeof window === 'undefined') {
    return
  }

  defineCustomElement(tagName, MastodonModalElement)
}

export const registerMastodonModalWebComponent = registerWebComponent

export const webComponentModule: WebComponentModule<MastodonModalElement> = {
  registeredName: COMPONENT_TAG_NAME,
  componentCtor: MastodonModalElement,
  registerWebComponent,
}
