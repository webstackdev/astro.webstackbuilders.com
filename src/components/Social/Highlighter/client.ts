/**
 * Highlighter Web Component
 * Creates shareable text highlights with social sharing dialog
 * Uses LoadableScript pattern for optimized loading
 */

import { LoadableScript } from '@components/scripts/loader'
import type { ShareData } from '@components/Social/common'
import { platforms, copyToClipboard, nativeShare } from '@components/Social/common'
import { MastodonModal } from '@components/Social/Mastodon/client'
import { getSlotElement } from '@components/Social/Highlighter/selectors'
import { handleScriptError, addScriptBreadcrumb } from '@components/scripts/errors'
import { addButtonEventListeners } from '@components/scripts/elementListeners'

/**
 * Highlighter element that creates a shareable text highlight
 * with a hover dialog showing social share options
 */
class HighlighterElement extends HTMLElement {
  declare shadowRoot: ShadowRoot
  private label: string

  constructor() {
    super()
    this.label = this.getAttribute('aria-label') || 'Share this'
    this.attachShadow({ mode: 'open' })
    this.render()
  }

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) {
      this.tabIndex = 0
    }
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', this.label)
    }

    this.setupEventListeners()
  }

  /**
   * Render the shadow DOM template
   */
  private render(): void {
    const template = document.createElement('template')
    template.innerHTML = `
      <style>${this.getStyles()}</style>
      <slot></slot>
      <div class="share-dialog" role="dialog" aria-label="${this.label}" aria-hidden="true">
        <div class="share-dialog__buttons">
          ${platforms
            .map(
              platform => `
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
            )
            .join('')}
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
    `
    this.shadowRoot.appendChild(template.content.cloneNode(true))
  }

  /**
   * Component styles using CSS custom properties and Tailwind-inspired classes
   */
  private getStyles(): string {
    return `
      :host {
        position: relative;
        display: inline;
        cursor: pointer;
        --highlight-bg: #bfdbfe;
        --highlight-bg-hover: #93c5fd;
        --highlight-text: inherit;
        --dialog-bg: #ffffff;
        --dialog-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        --button-hover: #f3f4f6;
      }

      :host(:hover),
      :host(:focus) {
        outline: 2px solid var(--highlight-bg-hover);
        outline-offset: 2px;
      }

      ::slotted(mark) {
        color: var(--highlight-text);
        background-color: var(--highlight-bg);
        padding: 0.125rem 0.25rem;
        border-radius: 0.25rem;
        transition: background-color 0.2s ease;
      }

      :host(:hover) ::slotted(mark),
      :host(:focus) ::slotted(mark) {
        background-color: var(--highlight-bg-hover);
      }

      .share-dialog {
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

      .share-dialog[aria-hidden="false"] {
        display: block;
      }

      .share-dialog__buttons {
        display: flex;
        gap: 0.25rem;
        align-items: center;
      }

      .share-button {
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

      .share-button:hover {
        background-color: var(--button-hover);
        transform: translateY(-1px);
      }

      .share-button:active {
        transform: translateY(0);
      }

      .share-button:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }

      .share-icon {
        width: 1.25rem;
        height: 1.25rem;
        fill: currentColor;
      }

      .copy-button {
        margin-left: 0.25rem;
        border-left: 1px solid #e5e7eb;
        padding-left: 0.75rem;
      }

      .share-dialog__arrow {
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
        :host {
          --highlight-bg: #1e40af;
          --highlight-bg-hover: #1e3a8a;
          --dialog-bg: #1f2937;
          --button-hover: #374151;
        }
      }
    `
  }

  /**
   * Setup event listeners for interaction
   */
  private setupEventListeners(): void {
    const context = { scriptName: 'Highlighter', operation: 'setupEventListeners' }
    addScriptBreadcrumb(context)

    try {
      // Show dialog on hover/focus
      this.addEventListener('mouseenter', () => this.showDialog())
      this.addEventListener('focusin', () => this.showDialog())

      // Hide dialog on mouse leave/blur
      this.addEventListener('mouseleave', () => this.hideDialog())
      this.addEventListener('focusout', () => this.hideDialog())

      // Keyboard navigation
      document.addEventListener('keyup', (e) => {
        try {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            this.showDialog()
          } else if (e.key === 'Escape') {
            this.hideDialog()
            this.blur()
          }
        } catch (error) {
          handleScriptError(error, { scriptName: 'Highlighter', operation: 'keyup' })
        }
      })

      // Share button clicks
      const buttons = this.shadowRoot.querySelectorAll<HTMLButtonElement>('.share-button')
      buttons.forEach(button => {
        addButtonEventListeners(button, (e) => {
          try {
            e.stopPropagation()
            const platformId = button.dataset['platform']
            if (platformId) {
              this.handleShare(platformId)
            }
          } catch (error) {
            handleScriptError(error, { scriptName: 'Highlighter', operation: 'shareClick' })
          }
        }, this)
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  /**
   * Show the share dialog
   */
  private showDialog(): void {
    const dialog = this.shadowRoot.querySelector('.share-dialog')
    if (dialog) {
      dialog.setAttribute('aria-hidden', 'false')
    }
  }

  /**
   * Hide the share dialog
   */
  private hideDialog(): void {
    const dialog = this.shadowRoot.querySelector('.share-dialog')
    if (dialog) {
      dialog.setAttribute('aria-hidden', 'true')
    }
  }

  /**
   * Get the highlighted text from the slot
   */
  private getHighlightedText(): string {
    const slot = getSlotElement(this.shadowRoot)
    const nodes = slot.assignedNodes({ flatten: true })
    return nodes
      .map(node => node.textContent?.trim() || '')
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
    const copyButton = this.shadowRoot.querySelector('.copy-button')
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
 * Highlighter LoadableScript for delayed initialization
 */
export class Highlighter extends LoadableScript {
  static override scriptName = 'Highlighter'
  static override eventType = 'delayed' as const

  static override init(): void {
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

  static override pause(): void {
    // No persistent state to pause
  }

  static override resume(): void {
    // No persistent state to resume
  }

  static override reset(): void {
    // No persistent state to reset
  }
}
