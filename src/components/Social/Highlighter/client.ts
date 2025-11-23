/**
 * Highlighter Web Component
 * Creates shareable text highlights with social sharing dialog
 * Uses LoadableScript pattern for optimized loading
 */

import type { ShareData } from '@components/Social/common'
import { platforms, copyToClipboard, nativeShare } from '@components/Social/common'
import { MastodonModal } from '@components/Social/Mastodon/client'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { addButtonEventListeners, addWrapperEventListeners } from '@components/scripts/elementListeners'
import { LitElement, html } from 'lit'

/**
 * Highlighter element that creates a shareable text highlight
 * with a hover dialog showing social share options
 */
class HighlighterElement extends LitElement {
  static override properties = {
    label: { type: String, attribute: 'aria-label', reflect: true },
  }

  label = 'Share this'
  private highlightContent: HTMLSpanElement
  private listenersAttached = false
  private contentCaptured = false
  private boundButtons = new WeakSet<HTMLButtonElement>()
  private triggerButton: HTMLButtonElement | null = null
  private wrapperElement: HTMLDivElement | null = null

  private handleMouseEnter = () => this.showDialog()
  private handleFocusIn = () => this.showDialog()
  private handleMouseLeave = () => this.hideDialog()
  private handleFocusOut = (event: FocusEvent) => {
    const nextTarget = event.relatedTarget as Node | null
    if (!nextTarget || !this.contains(nextTarget)) {
      this.hideDialog()
    }
  }

  constructor() {
    super()
    this.highlightContent = document.createElement('span')
    this.highlightContent.classList.add('highlighter__content')
  }

  protected override createRenderRoot(): HTMLElement {
    return this
  }

  public override connectedCallback(): void {
    this.captureInitialContent()
    super.connectedCallback()
    if (!this.label) {
      this.label = 'Share this'
    }
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', this.label)
    }
    this.attachHostListeners()
  }

  protected override firstUpdated(): void {
    this.bindTriggerButton()
    this.bindWrapperListeners()
    this.bindShareButtons()
  }

  protected override updated(): void {
    this.bindTriggerButton()
    this.bindWrapperListeners()
    this.bindShareButtons()
  }

  private captureInitialContent(): void {
    if (this.contentCaptured) return
    const fragment = document.createDocumentFragment()
    while (this.firstChild) {
      fragment.appendChild(this.firstChild)
    }
    if (fragment.childNodes.length > 0) {
      this.highlightContent.appendChild(fragment)
    }
    this.contentCaptured = true
  }

  protected override render() {
    return html`
      <style>${this.getStyles()}</style>
      <div class="highlighter__wrapper">
        <button type="button" class="highlighter__trigger" aria-label="${this.label}">
          ${this.highlightContent}
        </button>
        <div class="share-dialog" role="dialog" aria-label="${this.label}" aria-hidden="true">
          <div class="share-dialog__buttons">
            ${platforms.map(
              platform => html`
                <button
                  type="button"
                  class="share-button"
                  data-platform="${platform.id}"
                  aria-label="${platform.ariaLabel}"
                  title="${platform.ariaLabel}"
                >
                  <svg class="share-icon" aria-hidden="true">
                    <use href="/sprite.svg#${platform.icon}"></use>
                  </svg>
                </button>
              `
            )}
            <button
              type="button"
              class="share-button copy-button"
              data-platform="copy"
              aria-label="Copy link"
              title="Copy link"
            >
              <svg class="share-icon" aria-hidden="true">
                <use href="/sprite.svg#link"></use>
              </svg>
            </button>
          </div>
          <div class="share-dialog__arrow"></div>
        </div>
      </div>
    `
  }

  private attachHostListeners(): void {
    if (this.listenersAttached) return
    const context = { scriptName: 'Highlighter', operation: 'attachHostListeners' }
    addScriptBreadcrumb(context)

    try {
      this.addEventListener('mouseenter', this.handleMouseEnter)
      this.addEventListener('focusin', this.handleFocusIn)
      this.addEventListener('mouseleave', this.handleMouseLeave)
      this.addEventListener('focusout', this.handleFocusOut)
      this.listenersAttached = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private bindShareButtons(): void {
    const buttons = this.querySelectorAll<HTMLButtonElement>('.share-button')
    buttons.forEach(button => {
      if (this.boundButtons.has(button)) return
      addButtonEventListeners(
        button,
        (event) => {
          event.stopPropagation()
          const platformId = button.dataset['platform']
          if (platformId) {
            void this.handleShare(platformId)
          }
        },
        this
      )
      this.boundButtons.add(button)
    })
  }

  private bindTriggerButton(): void {
    const trigger = this.querySelector<HTMLButtonElement>('.highlighter__trigger')
    if (!trigger || trigger === this.triggerButton) return
    this.triggerButton = trigger
    addButtonEventListeners(trigger, (event) => {
      event.stopPropagation()
      this.handleComponentActivation()
    }, this)
  }

  private bindWrapperListeners(): void {
    const wrapper = this.querySelector<HTMLDivElement>('.highlighter__wrapper')
    if (!wrapper || wrapper === this.wrapperElement) return
    this.wrapperElement = wrapper
    addWrapperEventListeners(wrapper, () => {
      this.handleEscapeDismiss()
    }, this)
  }

  private handleComponentActivation(): void {
    this.showDialog()
  }

  private handleEscapeDismiss(): void {
    this.hideDialog()
    this.blur()
  }

  private getShareDialogElement(): HTMLElement | null {
    return this.querySelector('.share-dialog')
  }

  /**
   * Component styles using CSS custom properties and Tailwind-inspired classes
   */
  private getStyles(): string {
    return `
      :where(highlighter-element) {
        position: relative;
        display: inline-block;
        cursor: pointer;
        --highlight-bg: #bfdbfe;
        --highlight-bg-hover: #93c5fd;
        --highlight-text: inherit;
        --dialog-bg: #ffffff;
        --dialog-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        --button-hover: #f3f4f6;
      }

      :where(highlighter-element):hover,
      :where(highlighter-element):focus-within {
        outline: 2px solid var(--highlight-bg-hover);
        outline-offset: 2px;
      }

      :where(highlighter-element) .highlighter__wrapper {
        position: relative;
        display: inline-flex;
        flex-direction: column;
      }

      :where(highlighter-element) .highlighter__trigger {
        display: inline-flex;
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        font: inherit;
        color: inherit;
        cursor: inherit;
        text-align: left;
      }

      :where(highlighter-element) .highlighter__content {
        color: var(--highlight-text);
        background-color: var(--highlight-bg);
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
        transition: background-color 0.2s ease;
      }

      :where(highlighter-element):hover .highlighter__content,
      :where(highlighter-element):focus-within .highlighter__content {
        background-color: var(--highlight-bg-hover);
      }

      :where(highlighter-element) .share-dialog {
        display: none;
        position: absolute;
        bottom: calc(100% + 0.75rem);
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--dialog-bg);
        border-radius: 0.5rem;
        padding: 0.5rem;
        box-shadow: var(--dialog-shadow);
        z-index: 50;
        white-space: nowrap;
      }

      :where(highlighter-element) .share-dialog[aria-hidden="false"] {
        display: block;
      }

      :where(highlighter-element) .share-dialog__buttons {
        display: flex;
        gap: 0.25rem;
        align-items: center;
      }

      :where(highlighter-element) .share-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border: none;
        border-radius: 0.375rem;
        background-color: transparent;
        cursor: pointer;
        transition: background-color 0.2s ease, transform 0.1s ease;
        padding: 0.5rem;
      }

      :where(highlighter-element) .share-button:hover {
        background-color: var(--button-hover);
        transform: translateY(-1px);
      }

      :where(highlighter-element) .share-button:active {
        transform: translateY(0);
      }

      :where(highlighter-element) .share-button:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }

      :where(highlighter-element) .share-icon {
        width: 1.25rem;
        height: 1.25rem;
        fill: currentColor;
      }

      :where(highlighter-element) .copy-button {
        margin-left: 0.25rem;
        border-left: 1px solid #e5e7eb;
        padding-left: 0.75rem;
      }

      :where(highlighter-element) .share-dialog__arrow {
        position: absolute;
        bottom: -0.375rem;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 0.5rem solid transparent;
        border-right: 0.5rem solid transparent;
        border-top: 0.5rem solid var(--dialog-bg);
      }

      @media (prefers-color-scheme: dark) {
        :where(highlighter-element) {
          --highlight-bg: #1e40af;
          --highlight-bg-hover: #1e3a8a;
          --dialog-bg: #1f2937;
          --button-hover: #374151;
        }
      }
    `
  }

  /**
   * Show the share dialog
   */
  private showDialog(): void {
    const dialog = this.getShareDialogElement()
    if (dialog) {
      dialog.setAttribute('aria-hidden', 'false')
    }
  }

  /**
   * Hide the share dialog
   */
  private hideDialog(): void {
    const dialog = this.getShareDialogElement()
    if (dialog) {
      dialog.setAttribute('aria-hidden', 'true')
    }
  }

  /**
   * Get the highlighted text from the slot
   */
  private getHighlightedText(): string {
    const nodes = Array.from(this.highlightContent.childNodes)
    return nodes
      .map((node: ChildNode) => node.textContent?.trim() || '')
      .join(' ')
      .trim()
  }

  /**
   * Get share data for the current highlight
   */
  private getShareData(): ShareData {
    const text = this.getHighlightedText()
    return {
      text: `"${text}"`,
      url: window.location.href,
      title: document.title,
    }
  }

  /**
   * Handle share action for a specific platform
   */
  private async handleShare(platformId: string): Promise<void> {
    const context = { scriptName: 'Highlighter', operation: 'handleShare' }
    addScriptBreadcrumb(context)

    try {
      const data = this.getShareData()

      if (platformId === 'copy') {
        const success = await copyToClipboard(`${data.text} ${data.url}`)
        if (success) {
          this.showCopyFeedback()
          this.emitShareEvent(platformId, data)
        }
        return
      }

      // Handle Mastodon modal
      if (platformId === 'mastodon') {
        MastodonModal.openModal(`${data.text} ${data.url}`)
        this.hideDialog()
        this.emitShareEvent(platformId, data)
        return
      }

      // Try native share first on mobile
      if (typeof navigator.share === 'function') {
        const shared = await nativeShare(data)
        if (shared) {
          this.emitShareEvent(platformId, data)
          return
        }
      }

      // Fallback to platform-specific URL
      const platform = platforms.find(p => p.id === platformId)
      if (platform) {
        const shareUrl = platform.getShareUrl(data)
        window.open(shareUrl, '_blank', 'noopener,noreferrer')
        this.emitShareEvent(platformId, data)
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Show visual feedback for copy action
   */
  private showCopyFeedback(): void {
    const copyButton = this.querySelector<HTMLButtonElement>('.copy-button')
    if (copyButton) {
      const originalHTML = copyButton.innerHTML
      copyButton.innerHTML = `
        <svg class="share-icon" aria-hidden="true">
          <use href="/sprite.svg#check"></use>
        </svg>
      `
      setTimeout(() => {
        copyButton.innerHTML = originalHTML
      }, 2000)
    }
  }

  /**
   * Emit custom event for share tracking
   */
  private emitShareEvent(platform: string, data: ShareData): void {
    const event = new CustomEvent('highlighter:share', {
      detail: { platform, data },
      bubbles: true,
      composed: true,
    })
    this.dispatchEvent(event)
  }
}

/**
 * Highlighter for delayed initialization
 */
export class Highlighter {
  static scriptName = 'Highlighter'

  static init(): void {
    const context = { scriptName: Highlighter.scriptName, operation: 'init' }
    addScriptBreadcrumb(context)

    try {
      // Register custom element if not already registered
      if (!customElements.get('highlighter-element')) {
        customElements.define('highlighter-element', HighlighterElement)
      }
    } catch (error) {
      // Highlighter is optional enhancement
      handleScriptError(error, context)
    }
  }

  static pause(): void {
    // No persistent state to pause
  }

  static resume(): void {
    // No persistent state to resume
  }

  static reset(): void {
    // No persistent state to reset
  }
}
