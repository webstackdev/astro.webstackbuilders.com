/**
 * Article reading progress bar – Lit web component
 *
 * Renders a fixed `<progress>` element below the header that fills as
 * the visitor scrolls through the article `#content` region. Positioned
 * via `--theme-picker-offset` + `--header-current-height` from the
 * layout-position store.
 */
import { LitElement } from 'lit'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { handleScriptError } from '@components/scripts/errors/handler'
import { getProgressElement, getContentElement } from './selectors'

export class ReadingProgressBar extends LitElement {
  static registeredName = 'reading-progress-bar'

  /** Keep the element in light DOM so Tailwind / CSS variables work. */
  protected override createRenderRoot() {
    return this
  }

  // ── Internal state ──────────────────────────────────────────────────
  private progressEl: HTMLProgressElement | null = null
  private contentEl: HTMLElement | null = null
  private rafId: number | null = null
  private scrollHandler: (() => void) | null = null
  private resizeHandler: (() => void) | null = null

  // ── Lifecycle ───────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback()
    this.cacheElements()
    this.attachListeners()
    this.updateProgress()
  }

  override disconnectedCallback(): void {
    this.detachListeners()
    super.disconnectedCallback()
  }

  // ── DOM ─────────────────────────────────────────────────────────────

  private cacheElements(): void {
    this.progressEl = getProgressElement(this)
    this.contentEl = getContentElement()
  }

  // ── Listeners ───────────────────────────────────────────────────────

  private attachListeners(): void {
    this.scrollHandler = () => this.requestProgressUpdate()
    this.resizeHandler = () => this.requestProgressUpdate()

    window.addEventListener('scroll', this.scrollHandler, { passive: true })
    document.addEventListener('scroll', this.scrollHandler, { passive: true, capture: true })
    window.addEventListener('resize', this.resizeHandler, { passive: true })
  }

  private detachListeners(): void {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler)
      document.removeEventListener('scroll', this.scrollHandler, { capture: true })
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  // ── Progress calculation ────────────────────────────────────────────

  private requestProgressUpdate(): void {
    if (this.rafId !== null) return
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null
      this.updateProgress()
    })
  }

  /** Compute scroll progress through the `#content` region as 0–100. */
  private updateProgress(): void {
    try {
      if (!this.progressEl || !this.contentEl) return

      const rect = this.contentEl.getBoundingClientRect()
      const viewportHeight = window.innerHeight

      // Total scrollable distance for the content region
      const totalHeight = rect.height
      if (totalHeight <= 0) {
        this.progressEl.value = 0
        return
      }

      // How far past the top of the viewport has the content scrolled?
      // rect.top starts positive (below viewport top) and becomes negative.
      const scrolled = -rect.top
      const scrollableDistance = totalHeight - viewportHeight

      if (scrollableDistance <= 0) {
        // Content fits within one screen
        this.progressEl.value = 100
        return
      }

      const progress = Math.min(100, Math.max(0, (scrolled / scrollableDistance) * 100))
      this.progressEl.value = progress
    } catch (error) {
      handleScriptError(error, {
        scriptName: 'ReadingProgressBar',
        operation: 'updateProgress',
      })
    }
  }
}

export const registerProgressBarComponent = async (
  tagName = ReadingProgressBar.registeredName,
): Promise<void> => {
  defineCustomElement(tagName, ReadingProgressBar)
}

export const webComponentModule: WebComponentModule<ReadingProgressBar> = {
  registeredName: ReadingProgressBar.registeredName,
  componentCtor: ReadingProgressBar,
  registerWebComponent: registerProgressBarComponent,
}
