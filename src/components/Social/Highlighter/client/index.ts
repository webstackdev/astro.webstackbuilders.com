/**
 * Highlighter Web Component
 * Creates shareable text highlights with social sharing dialog
 * Uses LoadableScript pattern for optimized loading
 */

import type { ShareData } from '@components/Social/common'
import { platforms, nativeShare } from '@components/Social/common'
import { MastodonModal } from '@components/Social/Mastodon/client'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import {
  addButtonEventListeners,
  addWrapperEventListeners,
} from '@components/scripts/elementListeners'
import { LitElement, html } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  queryHighlighterTrigger,
  queryHighlighterWrapper,
  queryXIconGlyphPaths,
  queryXIconTilePath,
  queryShareDialogArrow,
  queryShareButtons,
  queryShareDialog,
  queryShareIcon,
} from './selectors'

import xIconRaw from '@icons/x.svg?raw'
import linkedinIconRaw from '@icons/linkedin.svg?raw'
import blueskyIconRaw from '@icons/bluesky.svg?raw'
import redditIconRaw from '@icons/reddit.svg?raw'
import mastodonIconRaw from '@icons/mastodon.svg?raw'

const SCRIPT_NAME = 'Highlighter'
const COMPONENT_TAG_NAME = 'highlighter-element'

const stripSvgWrapper = (svg: string): string => {
  const match = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
  const innerMarkup = match?.[1] ?? svg
  return innerMarkup.replace(/<title>[\s\S]*?<\/title>/gi, '').trim()
}

const platformIconMarkupById: Record<string, string> = {
  x: stripSvgWrapper(xIconRaw),
  linkedin: stripSvgWrapper(linkedinIconRaw),
  bluesky: stripSvgWrapper(blueskyIconRaw),
  reddit: stripSvgWrapper(redditIconRaw),
  mastodon: stripSvgWrapper(mastodonIconRaw),
}

const getPlatformIconMarkup = (platformId: string): string => {
  return platformIconMarkupById[platformId] ?? ''
}

let highlighterInstanceCounter = 0

/**
 * Highlighter element that creates a shareable text highlight
 * with a hover dialog showing social share options
 */
export class HighlighterElement extends LitElement {
  static registeredName = COMPONENT_TAG_NAME

  static override properties = {
    label: { type: String, attribute: 'aria-label', reflect: true },
  }

  declare label: string
  private highlightContent: HTMLSpanElement
  private listenersAttached = false
  private contentCaptured = false
  private boundButtons = new WeakSet<HTMLButtonElement>()
  private triggerButton: HTMLButtonElement | null = null
  private wrapperElement: HTMLDivElement | null = null
  private readonly dialogId: string
  private readonly hintId: string
  private readonly statusId: string

  private handleMouseEnter = () => this.showDialog()
  private handleFocusIn = (event: FocusEvent) => {
    if (this.isFocusVisibleTarget(event.target)) {
      this.applyFocusVisibleStyles()
      this.showDialog()
    }
  }
  private handleMouseLeave = () => this.hideDialog()
  private handleFocusOut = (event: FocusEvent) => {
    const nextTarget = event.relatedTarget as Node | null
    if (!nextTarget || !this.contains(nextTarget)) {
      this.removeFocusVisibleStyles()
      this.hideDialog()
    }
  }

  constructor() {
    super()
    this.highlightContent = document.createElement('span')
    this.highlightContent.classList.add('highlighter__content')

    highlighterInstanceCounter += 1
    this.dialogId = `highlighter-share-dialog-${highlighterInstanceCounter}`
    this.hintId = `highlighter-share-hint-${highlighterInstanceCounter}`
    this.statusId = `highlighter-share-status-${highlighterInstanceCounter}`
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
    this.applyThemeStyles()
  }

  protected override updated(): void {
    this.bindTriggerButton()
    this.bindWrapperListeners()
    this.bindShareButtons()
    this.applyThemeStyles()
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
      <div class="highlighter__wrapper">
        <button
          type="button"
          class="highlighter__trigger"
          aria-describedby="${this.hintId}"
          aria-controls="${this.dialogId}"
          aria-expanded="false"
        >
          ${this.highlightContent}
        </button>
        <span id="${this.hintId}" class="sr-only">${this.label}</span>
        <div
          id="${this.dialogId}"
          class="share-dialog"
          role="toolbar"
          aria-label="${this.label}"
          aria-hidden="true"
        >
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
                  <svg
                    class="share-icon"
                    aria-hidden="true"
                    focusable="false"
                    viewBox="0 0 24 24"
                  >
                    ${unsafeSVG(getPlatformIconMarkup(platform.id))}
                  </svg>
                </button>
              `
            )}
          </div>
          <div class="share-dialog__arrow"></div>
        </div>

        <span
          id="${this.statusId}"
          class="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-highlighter-status
        ></span>
      </div>
    `
  }

  private attachHostListeners(): void {
    if (this.listenersAttached) return
    const context = { scriptName: SCRIPT_NAME, operation: 'attachHostListeners' }
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
    const buttons = queryShareButtons(this)
    buttons.forEach(button => {
      if (this.boundButtons.has(button)) return
      addButtonEventListeners(
        button,
        event => {
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
    const trigger = queryHighlighterTrigger(this)
    if (!trigger || trigger === this.triggerButton) return
    this.triggerButton = trigger
    this.triggerButton.style.cursor = 'pointer'
    addButtonEventListeners(
      trigger,
      event => {
        event.stopPropagation()
        this.handleComponentActivation()
      },
      this
    )
  }

  private applyThemeStyles(): void {
    this.applyDialogThemeStyles()
    this.applyShareButtonThemeStyles()
  }

  private applyDialogThemeStyles(): void {
    const dialog = this.getShareDialogElement()
    if (!dialog) {
      return
    }

    dialog.style.backgroundColor = 'var(--color-page-base-offset)'

    const arrow = queryShareDialogArrow(dialog)
    if (arrow) {
      arrow.style.borderTopColor = 'var(--color-page-base-offset)'
    }
  }

  private applyShareButtonThemeStyles(): void {
    const buttons = queryShareButtons(this)
    buttons.forEach(button => {
      const platformId = button.dataset['platform']
      const icon = queryShareIcon(button)
      if (icon && platformId === 'x') {
        const tilePath = queryXIconTilePath(icon)
        const glyphPaths = queryXIconGlyphPaths(icon)

        if (tilePath) {
          tilePath.setAttribute('fill', 'var(--color-x)')
          tilePath.setAttribute('stroke', 'none')
        }

        glyphPaths.forEach((path: SVGPathElement) => {
          path.setAttribute('fill', 'var(--color-content-inverse)')
          path.setAttribute('stroke', 'none')
        })
      } else if (icon) {
        icon.style.fill = 'currentColor'
        icon.style.stroke = 'currentColor'
      }

      const token = this.getPlatformColorToken(platformId)
      if (!token) {
        return
      }

      if (platformId !== 'x') {
        button.style.color = `var(${token})`
      }
    })
  }

  private getPlatformColorToken(platformId: string | undefined): string | null {
    switch (platformId) {
      case 'x':
        return '--color-x'
      case 'linkedin':
        return '--color-linkedin'
      case 'bluesky':
        return '--color-bluesky'
      case 'reddit':
        return '--color-reddit'
      case 'mastodon':
        return '--color-mastodon'
      default:
        return null
    }
  }

  private applyFocusVisibleStyles(): void {
    if (!this.triggerButton) {
      return
    }

    this.triggerButton.style.outline = '2px solid var(--color-spotlight)'
    this.triggerButton.style.outlineOffset = '2px'
  }

  private removeFocusVisibleStyles(): void {
    if (!this.triggerButton) {
      return
    }

    this.triggerButton.style.outline = ''
    this.triggerButton.style.outlineOffset = ''
  }

  private isFocusVisibleTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false
    }

    try {
      return target.matches(':focus-visible')
    } catch {
      return true
    }
  }

  private bindWrapperListeners(): void {
    const wrapper = queryHighlighterWrapper(this)
    if (!wrapper || wrapper === this.wrapperElement) return
    this.wrapperElement = wrapper
    addWrapperEventListeners(
      wrapper,
      () => {
        this.handleEscapeDismiss()
      },
      this
    )
  }

  private handleComponentActivation(): void {
    this.showDialog()
  }

  private handleEscapeDismiss(): void {
    this.hideDialog()
    this.blur()
  }

  private getShareDialogElement(): HTMLElement | null {
    return queryShareDialog(this)
  }

  /**
   * Show the share dialog
   */
  private showDialog(): void {
    const dialog = this.getShareDialogElement()
    if (dialog) {
      dialog.setAttribute('aria-hidden', 'false')
    }

    this.triggerButton?.setAttribute('aria-expanded', 'true')
  }

  /**
   * Hide the share dialog
   */
  private hideDialog(): void {
    const dialog = this.getShareDialogElement()
    if (dialog) {
      dialog.setAttribute('aria-hidden', 'true')
    }

    this.triggerButton?.setAttribute('aria-expanded', 'false')
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
    const context = { scriptName: SCRIPT_NAME, operation: 'handleShare' }
    addScriptBreadcrumb(context)

    try {
      const data = this.getShareData()

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

export const registerWebComponent = (tagName = HighlighterElement.registeredName) => {
  if (typeof window === 'undefined') {
    return
  }

  defineCustomElement(tagName, HighlighterElement)
}

// Backwards compatibility for existing imports
export const registerHighlighterWebComponent = registerWebComponent

export const webComponentModule: WebComponentModule<HighlighterElement> = {
  registeredName: COMPONENT_TAG_NAME,
  componentCtor: HighlighterElement,
  registerWebComponent,
}
