/**
 * Abstract base class for Embla-powered carousels rendered as Lit custom elements.
 *
 * Encapsulates the shared behaviour that was previously duplicated across the
 * Carousel and Testimonials components:
 *
 * - Embla initialisation / teardown (with optional Autoplay plugin)
 * - Animation-lifecycle store integration (reduced-motion, visibility, user prefs)
 * - IntersectionObserver viewport gating (pause when off-screen)
 * - Focus-visible pause management
 * - Previous / Next navigation button wiring
 * - Dot-navigation rendering (with overridable active/inactive styling)
 * - E2E logging
 *
 * Subclasses must implement the abstract members listed below and may
 * optionally override the dot-styling hooks and `onInitialized()` /
 * `onTeardown()` for component-specific setup.
 */

import { LitElement } from 'lit'
import EmblaCarousel, { type EmblaCarouselType } from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import {
  createAnimationController,
  type AnimationControllerHandle,
  type AnimationPlayState,
} from '@components/scripts/store'
import { createE2ELogger } from './logging'
import type {
  EmblaCarouselConfig,
  EmblaElementHandles,
  EmblaRootElement,
  TimerHandle,
} from './types'

export abstract class EmblaCarouselBase extends LitElement {
  // ────────────────────── Light DOM ──────────────────────
  override createRenderRoot() {
    return this
  }

  // ────────────────────── Abstract / Overridable ──────────────────────

  /** Return component-specific Embla + autoplay configuration. */
  protected abstract getConfig(): EmblaCarouselConfig

  /** Query and return the DOM handles for this instance. */
  protected abstract queryElements(): EmblaElementHandles

  /**
   * Hook called after successful base initialisation.
   * Subclasses can wire up component-specific behaviour here
   * (keyboard handling, autoplay toggle buttons, status regions, etc.).
   */
  protected onInitialized(): void {
    /* no-op by default */
  }

  /**
   * Hook called during teardown, before the base class cleans up.
   * Subclasses should remove any listeners added in `onInitialized()`.
   */
  protected onTeardown(): void {
    /* no-op by default */
  }

  /**
   * Apply "active" styling to a dot button.
   * Override in subclasses that need different active-dot visuals.
   */
  protected applyDotActiveStyle(dot: HTMLButtonElement): void {
    dot.classList.add('is-active', 'bg-primary')
    dot.classList.remove('bg-content-active')
    dot.setAttribute('aria-current', 'true')
  }

  /**
   * Apply "inactive" styling to a dot button.
   * Override in subclasses that need different inactive-dot visuals.
   */
  protected applyDotInactiveStyle(dot: HTMLButtonElement): void {
    dot.classList.remove('is-active', 'bg-primary')
    dot.classList.add('bg-content-active')
    dot.removeAttribute('aria-current')
  }

  /**
   * Return the `aria-label` text for a dot at the given index.
   * Override for custom wording (e.g. "Go to testimonial 3").
   */
  protected getDotAriaLabel(index: number): string {
    return `Go to slide ${index + 1}`
  }

  /**
   * Hook called whenever the autoplay data-attribute changes.
   * Override in subclasses that need to react to play/pause transitions
   * (e.g. syncing an autoplay toggle button icon).
   */
  protected onAutoplayStateChange(_state: 'playing' | 'paused'): void {
    /* no-op by default */
  }

  /**
   * Return `true` when a slide child currently matches `:focus-visible`.
   * Override to use a component-specific selector helper (e.g.
   * `hasCarouselFocusVisibleSlide(this)`). The default returns `false`.
   */
  protected hasFocusVisibleSlide(): boolean {
    return false
  }

  /**
   * Return `true` when the focused element is inside a slide container.
   * Used by the base class to detect focus-visible pause triggers.
   * Override to use a component-specific slide-container selector.
   */
  protected isFocusInsideSlide(target: HTMLElement): boolean {
    void target
    return false
  }

  // ────────────────────── Protected read-only accessors ──────────────────────

  /** The live Embla API instance, or `null` before initialisation. */
  protected get emblaApi(): EmblaCarouselType | null {
    return this._emblaApi
  }

  /** Whether the carousel was successfully initialised. */
  protected get isInitialized(): boolean {
    return this._initialized
  }

  /** Whether the autoplay subsystem is active for this instance. */
  protected get hasAutoplaySupport(): boolean {
    return this._hasAutoplaySupport
  }

  /** The unique instance identifier (e.g. `carousel-1`). */
  protected get animationInstanceId(): string {
    return this._animationInstanceId
  }

  /** The Embla viewport element, or `null` before initialisation. */
  protected get viewport(): HTMLElement | null {
    return this._viewport
  }

  /** The previous-slide button, or `null` if not present. */
  protected get prevBtn(): HTMLButtonElement | null {
    return this._prevBtn
  }

  /** The next-slide button, or `null` if not present. */
  protected get nextBtn(): HTMLButtonElement | null {
    return this._nextBtn
  }

  // ────────────────────── Private state ──────────────────────

  private _emblaApi: EmblaCarouselType | null = null
  private _autoplayPlugin: ReturnType<typeof Autoplay> | null = null
  private _emblaRoot: EmblaRootElement | null = null
  private _viewport: HTMLElement | null = null
  private _dotsContainer: HTMLElement | null = null
  private _prevBtn: HTMLButtonElement | null = null
  private _nextBtn: HTMLButtonElement | null = null
  private _initialized = false
  private _animationController: AnimationControllerHandle | undefined
  private _pendingAutoplayState: AnimationPlayState | null = null
  private _hasAutoplaySupport = false
  private _autoplayReady = false
  private _autoplayReadyScheduled = false
  private _autoplayReadyTimer: TimerHandle | null = null
  private _intersectionObserver: IntersectionObserver | undefined
  private _isFullyInViewport = true
  private _requestedAutoplayState: AnimationPlayState = 'paused'
  private _focusVisibleCheckRafId: number | null = null
  private _animationInstanceId = ''

  private _config!: EmblaCarouselConfig
  private _logForE2E!: ReturnType<typeof createE2ELogger>

  // Bound handlers (stable references for add/removeEventListener)
  private readonly _autoplayPlayHandler = () => this.setAutoplayDataAttr('playing')
  private readonly _autoplayStopHandler = () => this.setAutoplayDataAttr('paused')
  private readonly _focusInHandler = (event: FocusEvent) => this.handleFocusIn(event)
  private readonly _focusOutHandler = () => this.scheduleFocusVisiblePauseSync()

  private static _instanceCounter = 0

  // ────────────────────── Lit Lifecycle ──────────────────────

  override connectedCallback(): void {
    super.connectedCallback()
    if (typeof document === 'undefined') return

    EmblaCarouselBase._instanceCounter += 1
    this._config = this.getConfig()
    this._animationInstanceId = `${this._config.logPrefix}-${EmblaCarouselBase._instanceCounter}`
    this._logForE2E = createE2ELogger(this._config.logPrefix)

    const context = { scriptName: this._config.scriptName, operation: 'connectedCallback' }
    addScriptBreadcrumb(context)

    try {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initialize(), { once: true })
        return
      }
      this.initialize()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    if (typeof document === 'undefined') return
    this.teardown()
  }

  // ────────────────────── Initialisation ──────────────────────

  private initialize(): void {
    if (this._initialized) return

    const context = { scriptName: this._config.scriptName, operation: 'initialize' }
    addScriptBreadcrumb(context)
    this._logForE2E('info', 'initialize:start', {
      id: this._animationInstanceId,
      existingReadyState: this.getAttribute('data-carousel-ready') ?? 'missing',
    })

    try {
      const handles = this.queryElements()
      this._emblaRoot = handles.emblaRoot
      this._viewport = handles.viewport
      this._dotsContainer = handles.dotsContainer ?? null
      this._prevBtn = handles.prevBtn ?? null
      this._nextBtn = handles.nextBtn ?? null

      const viewport = handles.viewport
      const slideCount = handles.slideCount

      // Autoplay plugin (only if options provided and multiple slides)
      const autoplayOpts = this._config.autoplayOptions
      const requestedAutoplay =
        autoplayOpts && slideCount > 1 ? Autoplay({ ...autoplayOpts }) : null
      this._autoplayReady = false
      this._autoplayReadyScheduled = false
      const plugins = requestedAutoplay ? [requestedAutoplay] : []

      this._emblaApi = EmblaCarousel(viewport, this._config.emblaOptions, plugins)
      this._emblaRoot.__emblaApi__ = this._emblaApi

      const emblaSnapCount = this._emblaApi.scrollSnapList().length
      const supportsAutoplay = slideCount > 1 && emblaSnapCount > 1 && requestedAutoplay !== null
      this._hasAutoplaySupport = supportsAutoplay
      this._autoplayPlugin = supportsAutoplay ? requestedAutoplay : null
      this.setAutoplayDataAttr('paused')
      this._requestedAutoplayState = 'paused'

      if (this._autoplayPlugin) {
        const emblaWithEvents = this._emblaApi as EmblaCarouselType & {
          on: (_event: string, _handler: () => void) => EmblaCarouselType
        }
        emblaWithEvents.on('autoplay:play', this._autoplayPlayHandler)
        emblaWithEvents.on('autoplay:stop', this._autoplayStopHandler)
      }

      this.setupNavigationButtons()
      this.setupDotsNavigation()
      this.addEventListener('focusin', this._focusInHandler)
      this.addEventListener('focusout', this._focusOutHandler)

      this._initialized = true
      this.setAttribute('data-carousel-ready', 'true')

      this._logForE2E('info', 'initialize:complete', {
        id: this._animationInstanceId,
        slideCount,
        supportsAutoplay: this._hasAutoplaySupport,
      })

      if (this._hasAutoplaySupport) {
        this.registerAnimationLifecycle()
        this.setupViewportObserver()
        this.scheduleAutoplayReady()
        this.scheduleFocusVisiblePauseSync()
      }

      // Subclass hook
      this.onInitialized()
    } catch (error) {
      this.teardown()
      this._logForE2E('error', 'initialize:failed', {
        id: this._animationInstanceId,
        message: error instanceof Error ? error.message : String(error),
      })
      handleScriptError(error, context)
    }
  }

  // ────────────────────── Teardown ──────────────────────

  private teardown(): void {
    // Subclass hook (runs first so it can still read base state)
    this.onTeardown()

    this.teardownViewportObserver()
    this.removeEventListener('focusin', this._focusInHandler)
    this.removeEventListener('focusout', this._focusOutHandler)

    if (typeof window !== 'undefined' && this._focusVisibleCheckRafId !== null) {
      window.cancelAnimationFrame(this._focusVisibleCheckRafId)
      this._focusVisibleCheckRafId = null
    }

    if (this._emblaApi) {
      const emblaWithEvents = this._emblaApi as EmblaCarouselType & {
        off: (_event: string, _handler: () => void) => EmblaCarouselType
      }
      if (this._autoplayPlugin) {
        emblaWithEvents.off('autoplay:play', this._autoplayPlayHandler)
        emblaWithEvents.off('autoplay:stop', this._autoplayStopHandler)
      }
      this._emblaApi.destroy()
    }

    if (this._emblaRoot && '__emblaApi__' in this._emblaRoot) {
      delete this._emblaRoot.__emblaApi__
    }

    this._emblaApi = null
    this._autoplayPlugin = null
    this._viewport = null
    this._initialized = false
    this.removeAttribute('data-carousel-ready')
    this.removeAttribute('data-carousel-autoplay')
    this._animationController?.setInstancePauseState('focus-visible', false)
    this._animationController?.destroy()
    this._animationController = undefined
    this._pendingAutoplayState = null
    this._hasAutoplaySupport = false

    if (this._autoplayReadyTimer) {
      clearTimeout(this._autoplayReadyTimer)
      this._autoplayReadyTimer = null
    }
    this._autoplayReadyScheduled = false
    this._autoplayReady = false

    if (this._dotsContainer) {
      this._dotsContainer.innerHTML = ''
    }
  }

  // ────────────────────── Focus-visible pause ──────────────────────

  private handleFocusIn(event: FocusEvent): void {
    if (!this._hasAutoplaySupport || !this._animationController) return

    const target = event.target
    if (!(target instanceof HTMLElement)) return

    if (!this.isFocusInsideSlide(target)) return
    if (!this.isElementFocusVisible(target)) return
    this._animationController.setInstancePauseState('focus-visible', true)
  }

  private scheduleFocusVisiblePauseSync(): void {
    if (!this._hasAutoplaySupport || !this._animationController) return

    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      this.syncFocusVisiblePauseState()
      return
    }

    if (this._focusVisibleCheckRafId !== null) {
      window.cancelAnimationFrame(this._focusVisibleCheckRafId)
    }

    this._focusVisibleCheckRafId = window.requestAnimationFrame(() => {
      this._focusVisibleCheckRafId = null
      this.syncFocusVisiblePauseState()
    })
  }

  private syncFocusVisiblePauseState(): void {
    if (!this._animationController) return
    this._animationController.setInstancePauseState('focus-visible', this.hasFocusVisibleSlide())
  }

  private isElementFocusVisible(element: HTMLElement): boolean {
    try {
      return element.matches(':focus-visible')
    } catch {
      return false
    }
  }

  // ────────────────────── Navigation buttons ──────────────────────

  private setupNavigationButtons(): void {
    if (!this._emblaApi || !this._prevBtn || !this._nextBtn) return

    const scriptName = this._config.scriptName

    const updateButtonStates = () => {
      if (!this._emblaApi || !this._prevBtn || !this._nextBtn) return

      if (this._emblaApi.canScrollPrev()) {
        this._prevBtn.removeAttribute('disabled')
        this._prevBtn.classList.remove('opacity-30', 'cursor-not-allowed')
      } else {
        this._prevBtn.setAttribute('disabled', 'true')
        this._prevBtn.classList.add('opacity-30', 'cursor-not-allowed')
      }

      if (this._emblaApi.canScrollNext()) {
        this._nextBtn.removeAttribute('disabled')
        this._nextBtn.classList.remove('opacity-30', 'cursor-not-allowed')
      } else {
        this._nextBtn.setAttribute('disabled', 'true')
        this._nextBtn.classList.add('opacity-30', 'cursor-not-allowed')
      }
    }

    addButtonEventListeners(
      this._prevBtn,
      () => {
        try {
          this._emblaApi?.scrollPrev()
        } catch (error) {
          handleScriptError(error, { scriptName, operation: 'scrollPrev' })
        }
      },
      this
    )

    addButtonEventListeners(
      this._nextBtn,
      () => {
        try {
          this._emblaApi?.scrollNext()
        } catch (error) {
          handleScriptError(error, { scriptName, operation: 'scrollNext' })
        }
      },
      this
    )

    this._emblaApi.on('select', updateButtonStates)
    this._emblaApi.on('reInit', updateButtonStates)
    updateButtonStates()
  }

  // ────────────────────── Dots navigation ──────────────────────

  private setupDotsNavigation(): void {
    if (!this._emblaApi || !this._dotsContainer) return

    const scriptName = this._config.scriptName
    const dotsContainer = this._dotsContainer
    const ownerDocument = this.ownerDocument ?? document
    let dots: HTMLButtonElement[] = []

    const rebuildDots = () => {
      if (!this._emblaApi) return
      dotsContainer.innerHTML = ''
      dots = []

      this._emblaApi.scrollSnapList().forEach((_, index) => {
        const dot = ownerDocument.createElement('button')
        dot.type = 'button'
        dot.dataset['index'] = String(index)
        dot.tabIndex = -1
        dot.setAttribute('tabindex', '-1')
        dot.className =
          'embla__dot w-3 h-3 rounded-full bg-content-active transition-all duration-300 hover:bg-primary'
        dot.setAttribute('aria-label', this.getDotAriaLabel(index))

        addButtonEventListeners(
          dot,
          () => {
            try {
              this._emblaApi?.scrollTo(index)
            } catch (error) {
              handleScriptError(error, { scriptName, operation: 'scrollToDot' })
            }
          },
          this
        )

        dotsContainer.appendChild(dot)
        dots.push(dot)
      })
    }

    const updateDots = () => {
      if (!this._emblaApi) return
      const selectedIndex = this._emblaApi.selectedScrollSnap()

      dots.forEach((dot, index) => {
        if (index === selectedIndex) {
          this.applyDotActiveStyle(dot)
        } else {
          this.applyDotInactiveStyle(dot)
        }
      })
    }

    rebuildDots()
    updateDots()

    this._emblaApi.on('select', updateDots)
    this._emblaApi.on('reInit', () => {
      rebuildDots()
      updateDots()
    })
  }

  // ────────────────────── Pause / Resume (public API) ──────────────────────

  pause(): void {
    try {
      this._requestedAutoplayState = 'paused'
      this.syncAutoplayWithViewport()
    } catch (error) {
      handleScriptError(error, { scriptName: this._config.scriptName, operation: 'pause' })
    }
  }

  resume(): void {
    try {
      this._requestedAutoplayState = 'playing'
      this.syncAutoplayWithViewport()
    } catch (error) {
      handleScriptError(error, { scriptName: this._config.scriptName, operation: 'resume' })
    }
  }

  // ────────────────────── Viewport observer ──────────────────────

  private setupViewportObserver(): void {
    if (typeof document === 'undefined') return
    if (this._intersectionObserver) return

    try {
      const IntersectionObserverCtor = (
        globalThis as unknown as { IntersectionObserver?: typeof IntersectionObserver }
      ).IntersectionObserver

      if (typeof IntersectionObserverCtor !== 'function') return

      this._intersectionObserver = new IntersectionObserverCtor(
        entries => {
          const entry = entries[0]
          const ratio = entry?.intersectionRatio ?? 0
          this._isFullyInViewport = Boolean(entry?.isIntersecting && ratio >= 0.999)
          this.syncAutoplayWithViewport()
        },
        { threshold: [0, 0.999] }
      )

      const observedTarget = this._emblaRoot ?? this
      this._intersectionObserver.observe(observedTarget)
    } catch {
      // Best effort only
    }
  }

  private teardownViewportObserver(): void {
    try {
      this._intersectionObserver?.disconnect()
      this._intersectionObserver = undefined
      this._isFullyInViewport = true
    } catch {
      // Best effort only
    }
  }

  private syncAutoplayWithViewport(): void {
    const shouldPlay = this._requestedAutoplayState === 'playing' && this._isFullyInViewport
    this.updateAutoplayState(shouldPlay ? 'playing' : 'paused')
  }

  // ────────────────────── Autoplay state management ──────────────────────

  private setAutoplayDataAttr(state: 'playing' | 'paused'): void {
    this.setAttribute('data-carousel-autoplay', state)
    this.onAutoplayStateChange(state)
  }

  private updateAutoplayState(state: AnimationPlayState): void {
    if (
      !this._hasAutoplaySupport ||
      !this._autoplayPlugin ||
      !this._emblaApi ||
      !this._initialized ||
      !this._autoplayReady
    ) {
      if (this._hasAutoplaySupport) {
        this._pendingAutoplayState = state
        this.setAutoplayDataAttr(state)
      } else {
        this._pendingAutoplayState = null
        this.setAutoplayDataAttr('paused')
      }
      return
    }

    this._pendingAutoplayState = null
    if (state === 'playing') {
      this._autoplayPlugin.play()
    } else {
      this._autoplayPlugin.stop()
    }
    this.setAutoplayDataAttr(state)
  }

  private flushPendingAutoplayState(): void {
    if (!this._pendingAutoplayState || !this._autoplayReady || !this._autoplayPlugin) return

    const pendingState = this._pendingAutoplayState
    this._pendingAutoplayState = null

    try {
      this.updateAutoplayState(pendingState)
    } catch (error) {
      handleScriptError(error, {
        scriptName: this._config.scriptName,
        operation: 'flushAutoplay',
      })
    }
  }

  // ────────────────────── Animation lifecycle ──────────────────────

  private registerAnimationLifecycle(): void {
    if (this._animationController || !this._hasAutoplaySupport) return
    this._animationController = createAnimationController({
      animationId: this._config.animationId,
      instanceId: this._animationInstanceId,
      debugLabel: this._config.scriptName,
      onPlay: () => {
        this.resume()
      },
      onPause: () => {
        this.pause()
      },
    })
  }

  private scheduleAutoplayReady(): void {
    if (this._autoplayReadyScheduled || !this._autoplayPlugin) return
    this._autoplayReadyScheduled = true

    const markReady = () => {
      this._autoplayReadyScheduled = false
      this._autoplayReadyTimer = null
      if (!this._initialized || !this._autoplayPlugin) return
      this._autoplayReady = true
      this.flushPendingAutoplayState()
    }

    if (typeof window === 'undefined') {
      markReady()
      return
    }

    this._autoplayReadyTimer = window.setTimeout(markReady, 0)
  }
}
