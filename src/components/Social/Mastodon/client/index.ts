import { LitElement, html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
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
import {
  getMastodonModalElement,
  queryMastodonIconMarkup,
  queryMastodonInstanceInput,
} from './selectors'

const COMPONENT_TAG_NAME = 'mastodon-modal-element'
const ICON_BANK_ID = 'mastodon-modal-icon-bank'

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

const hasTagName = (target: EventTarget | null, expectedTagName: string): boolean => {
  if (!target || typeof target !== 'object' || !('tagName' in target)) {
    return false
  }

  return (target as { tagName?: string }).tagName === expectedTagName
}

const isTextInput = (target: EventTarget | null): target is HTMLInputElement => {
  return hasTagName(target, 'INPUT')
}

const isTextArea = (target: EventTarget | null): target is HTMLTextAreaElement => {
  return hasTagName(target, 'TEXTAREA')
}

export class MastodonModalElement extends LitElement {
  static registeredName = COMPONENT_TAG_NAME

  static override properties = {
    modalId: { type: String, attribute: 'modal-id' },
    open: { type: Boolean, reflect: true },
    shareText: { type: String, attribute: false },
    instanceValue: { type: String, attribute: false },
    shareTextFocusVisible: { type: Boolean, attribute: false },
    suppressInitialInstanceFocusVisible: { type: Boolean, attribute: false },
    instanceInputFocusVisible: { type: Boolean, attribute: false },
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
  declare shareTextFocusVisible: boolean
  declare suppressInitialInstanceFocusVisible: boolean
  declare instanceInputFocusVisible: boolean
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
    this.shareTextFocusVisible = false
    this.suppressInitialInstanceFocusVisible = false
    this.instanceInputFocusVisible = false
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
      this.shareTextFocusVisible = false
      this.suppressInitialInstanceFocusVisible = true
      this.instanceInputFocusVisible = false
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
    this.shareTextFocusVisible = false
    this.suppressInitialInstanceFocusVisible = false
    this.instanceInputFocusVisible = false
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
    if (isTextInput(target)) {
      this.rememberInstance = target.checked
    }
  }

  private handleInstanceInput(event: Event): void {
    const target = event.target
    if (isTextInput(target)) {
      this.instanceValue = target.value
    }
  }

  private handleShareTextInput(event: Event): void {
    const target = event.target
    if (isTextArea(target)) {
      this.shareText = target.value
    }
  }

  private updateFocusVisibleState(
    element: HTMLInputElement | HTMLTextAreaElement,
    applyState: (_isFocusVisible: boolean) => void
  ): void {
    const scheduleUpdate =
      typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame.bind(window)
        : (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0)

    scheduleUpdate(() => {
      if (typeof document === 'undefined' || document.activeElement !== element) {
        return
      }

      applyState(element.matches(':focus-visible'))
    })
  }

  private handleShareTextFocus(event: FocusEvent): void {
    const target = event.target
    if (isTextArea(target)) {
      this.updateFocusVisibleState(target, isFocusVisible => {
        this.shareTextFocusVisible = isFocusVisible
      })
    }
  }

  private handleShareTextBlur(): void {
    this.shareTextFocusVisible = false
  }

  private handleInstanceFocus(event: FocusEvent): void {
    const target = event.target
    if (isTextInput(target)) {
      if (this.suppressInitialInstanceFocusVisible) {
        this.suppressInitialInstanceFocusVisible = false
        this.instanceInputFocusVisible = false
        return
      }

      this.updateFocusVisibleState(target, isFocusVisible => {
        this.instanceInputFocusVisible = isFocusVisible
      })
    }
  }

  private handleInstanceBlur(): void {
    this.instanceInputFocusVisible = false
  }

  protected override render() {
    const modalTitleId = `${this.modalId}-title`
    const instanceHintId = `${this.modalId}-instance-hint`
    const closeIconMarkup =
      typeof document !== 'undefined'
        ? queryMastodonIconMarkup({
            iconBankId: ICON_BANK_ID,
            iconName: 'close',
            root: document,
          })
        : null
    const mastodonIconMarkup =
      typeof document !== 'undefined'
        ? queryMastodonIconMarkup({
            iconBankId: ICON_BANK_ID,
            iconName: 'mastodon',
            root: document,
          })
        : null

    return html`
      <div
        id=${this.modalId}
        class="fixed inset-0 z-(--z-modal) flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby=${modalTitleId}
        ?hidden=${!this.open}
      >
        <div
          class="modal-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click=${(event: Event) => this.handleBackdropClick(event)}
        ></div>
        <div class="modal-content relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl bg-page-base shadow-2xl">
          <div class="bg-page-inverse px-6 py-5 flex items-center justify-between">
            <div class="flex items-center gap-3 text-content-inverse">
              ${mastodonIconMarkup ? unsafeHTML(mastodonIconMarkup) : null}
              <h2 id=${modalTitleId} class="m-0 text-lg font-bold text-content-inverse">
                Share to Mastodon
              </h2>
            </div>
            <button
              type="button"
              class="modal-close relative flex items-center justify-center w-8 h-8 rounded-full bg-white/20 border-0 cursor-pointer text-primary-inverse transition-colors hover:bg-white/30 focus-visible:outline-none after:pointer-events-none after:absolute after:content-[''] after:inset-0 after:rounded-none after:border-2 after:border-transparent after:opacity-0 after:transition-opacity after:duration-150 after:ease-out focus-visible:after:opacity-100 focus-visible:after:-inset-1 focus-visible:after:border-spotlight"
              aria-label="Close modal"
              @click=${() => this.closeModal()}
            >
              ${closeIconMarkup ? unsafeHTML(closeIconMarkup) : null}
            </button>
          </div>

          <form
            id="mastodon-share-form"
            class="flex flex-col gap-5 p-6 bg-page-base"
            @submit=${(event: Event) => this.handleSubmit(event)}
          >
            <div class="flex flex-col gap-2">
              <label for="share-text" class="text-sm font-medium text-content-offset uppercase tracking-wider">
                Text to share
              </label>
              <div
                class=${`relative after:pointer-events-none after:absolute after:content-[''] after:inset-0 after:rounded-none after:border-2 after:border-transparent ${this.shareTextFocusVisible ? 'after:-inset-1 after:border-spotlight' : ''}`}
              >
                <textarea
                  id="share-text"
                  name="text"
                  rows="4"
                  class="w-full p-3 border border-trim-offset rounded-lg bg-page-offset font-[inherit] text-sm leading-6 resize-y outline-none focus:border-trim-offset focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:border-trim-offset focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none"
                  .value=${this.shareText}
                  @input=${(event: Event) => this.handleShareTextInput(event)}
                  @focus=${(event: FocusEvent) => this.handleShareTextFocus(event)}
                  @blur=${() => this.handleShareTextBlur()}
                ></textarea>
              </div>
            </div>

            <div class="flex flex-col gap-4">
              <label for="mastodon-instance" class="flex flex-col gap-2 font-medium">
                <span class="text-sm font-medium text-content-offset uppercase tracking-wider">
                  Instance
                </span>
                <span id=${instanceHintId} class="sr-only"
                  >Enter only the domain, without https://</span
                >
                <div
                  class=${`relative flex items-stretch border border-trim-offset rounded-lg overflow-hidden bg-page-base after:pointer-events-none after:absolute after:content-[''] after:inset-0 after:rounded-none after:border-2 after:border-transparent ${this.instanceInputFocusVisible ? 'after:-inset-1 after:border-spotlight' : ''}`}
                >
                  <span
                    class="flex items-center px-3 py-2 bg-page-offset text-sm text-content-offset select-none"
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
                    class="flex-1 min-w-0 px-3 py-2 border-0 bg-transparent text-base text-content outline-none focus:border-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none"
                    .value=${this.instanceValue}
                    @focus=${(event: FocusEvent) => this.handleInstanceFocus(event)}
                    @blur=${() => this.handleInstanceBlur()}
                    @input=${(event: Event) => this.handleInstanceInput(event)}
                  />
                </div>
              </label>

              ${this.savedInstances.length > 0
                ? html`<div id="saved-instances" class="flex flex-col gap-2">
                    <p class="m-0 text-sm font-medium">Previously used:</p>
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

              <label for="remember-instance" class="flex items-center gap-2 text-sm cursor-pointer text-content-offset">
                <input
                  type="checkbox"
                  id="remember-instance"
                  name="remember"
                  class="relative w-4 h-4 cursor-pointer accent-accent focus-visible:outline-none after:pointer-events-none after:absolute after:content-[''] after:inset-0 after:rounded-none after:border-2 after:border-transparent focus-visible:after:-inset-1 focus-visible:after:border-spotlight"
                  .checked=${this.rememberInstance}
                  @change=${(event: Event) => this.handleRememberChange(event)}
                />
                <span>Remember this instance</span>
              </label>
            </div>

            <div class="flex gap-3 justify-end pt-2">
              <button
                type="button"
                class="btn-secondary modal-cancel relative px-5 py-2.5 border border-trim-offset rounded-lg font-medium cursor-pointer bg-transparent text-content hover:bg-page-offset transition-colors focus-visible:outline-none after:pointer-events-none after:absolute after:content-[''] after:inset-0 after:rounded-none after:border-2 after:border-transparent after:opacity-0 after:transition-opacity after:duration-150 after:ease-out focus-visible:after:opacity-100 focus-visible:after:-inset-1 focus-visible:after:border-spotlight"
                @click=${() => this.closeModal()}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn-primary relative px-5 py-2.5 border-0 rounded-lg font-medium cursor-pointer bg-page-inverse text-content-inverse hover:bg-content-active transition-colors focus-visible:outline-none after:pointer-events-none after:absolute after:content-[''] after:inset-0 after:rounded-none after:border-2 after:border-transparent after:opacity-0 after:transition-opacity after:duration-150 after:ease-out focus-visible:after:opacity-100 focus-visible:after:-inset-1 focus-visible:after:border-spotlight disabled:opacity-50 disabled:cursor-not-allowed"
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
          background: var(--color-page-offset);
          border: 1px solid var(--color-trim);
          border-radius: 0.25rem;
          color: var(--color-primary);
          cursor: pointer;
          font-size: 0.875rem;
          padding: 0.25rem 0.5rem;
          position: relative;
          transition: all 0.15s ease;
        }

        .saved-list :global(.saved-instance)::after {
          border: 2px solid transparent;
          border-radius: 0;
          content: '';
          inset: 0;
          opacity: 0;
          pointer-events: none;
          position: absolute;
          transition: opacity 0.15s ease;
        }

        .saved-list :global(.saved-instance:hover) {
          background: var(--color-primary);
          color: var(--color-page-base);
        }

        .saved-list :global(.saved-instance:focus-visible) {
          outline: none;
        }

        .saved-list :global(.saved-instance:focus-visible)::after {
          border-color: var(--color-spotlight);
          inset: -0.25rem;
          opacity: 1;
        }

        .modal-status.error {
          color: var(--color-danger);
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
