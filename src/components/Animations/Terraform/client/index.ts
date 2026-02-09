import { LitElement } from 'lit'
import { gsap } from 'gsap'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import {
  createAnimationController,
  type AnimationControllerHandle,
  type AnimationPlayState,
} from '@components/scripts/store'
import { defineCustomElement } from '@components/scripts/utils'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  queryAnimationToggleButton,
  queryAnimationTogglePauseIcon,
  queryAnimationTogglePlayIcon,
  queryEdgePath,
} from './selectors'

const SCRIPT_NAME = 'TerraformAnimationElement'
const COMPONENT_TAG_NAME = 'terraform-animation'

/** Adjust this single value to speed up (>1) or slow down (<1) the entire animation. */
const TIMESCALE = 0.7

type Timeline = ReturnType<typeof gsap.timeline>

export class TerraformAnimationElement extends LitElement {
  private timeline: Timeline | null = null
  private initialized = false
  private animationReady = false
  private deferredInitRafId: number | null = null
  private deferredInitFrames = 0
  private animationController: AnimationControllerHandle | undefined
  private toggleButton: HTMLButtonElement | null = null
  private intersectionObserver: IntersectionObserver | undefined
  private isInViewport = true
  private isPageVisible = true
  private readonly domReadyHandler = () => {
    document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
    this.initialize()
  }
  private readonly visibilityChangeHandler = () => {
    try {
      if (typeof document === 'undefined') return
      this.isPageVisible = document.visibilityState !== 'hidden'
      this.syncPlaybackWithVisibility()
    } catch {
      // Best effort only
    }
  }
  private readonly toggleClickHandler = (event: Event) => {
    this.handleToggleClick(event)
  }

  override createRenderRoot() {
    return this
  }

  override connectedCallback(): void {
    super.connectedCallback()
    if (typeof document === 'undefined') return

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.domReadyHandler)
      return
    }

    this.initialize()
  }

  override disconnectedCallback(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
      this.teardown()
    }
    super.disconnectedCallback()
  }

  initialize(): void {
    if (this.initialized) return

    const context = { scriptName: SCRIPT_NAME, operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      this.toggleButton = queryAnimationToggleButton(this)

      if (this.toggleButton) {
        addButtonEventListeners(this.toggleButton, this.toggleClickHandler, this)
      }

      // The component is `hidden lg:flex` in production markup.
      // Avoid starting the animation (and registering lifecycle listeners) when the viewport
      // is below the `lg` breakpoint, because it is not shown.
      if (this.isHiddenOnThisViewport()) {
        this.setAnimationState('paused')
        this.scheduleDeferredInitialization()
        this.initialized = true
        return
      }

      this.setupAnimationAndController()
      this.initialized = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private scheduleDeferredInitialization(): void {
    if (typeof window === 'undefined') return
    if (this.deferredInitRafId !== null) return

    const tick = () => {
      this.deferredInitRafId = null

      if (this.animationReady) return

      if (!this.isHiddenOnThisViewport()) {
        this.setupAnimationAndController()
        return
      }

      this.deferredInitFrames += 1
      if (this.deferredInitFrames >= 60) return

      this.deferredInitRafId = window.requestAnimationFrame(tick)
    }

    this.deferredInitRafId = window.requestAnimationFrame(tick)
  }

  private setupAnimationAndController(): void {
    if (this.animationReady) return
    if (this.isHiddenOnThisViewport()) return

    this.startAnimation()
    if (!this.timeline) return

    // Start from a known baseline and let the global lifecycle store decide what happens next.
    this.timeline.play(0)
    this.setAnimationState('playing')

    this.setupVisibilityHandlers()

    this.animationController = createAnimationController({
      animationId: 'terraform-animation',
      debugLabel: SCRIPT_NAME,
      defaultState: 'playing',
      initialState: 'playing',
      onPause: () => {
        this.pause()
      },
      onPlay: () => {
        this.resume()
      },
    })

    // Ensure visibility rules (viewport/document) take effect even if the store chooses 'playing'.
    this.syncPlaybackWithVisibility()
    this.animationReady = true
  }

  private isHiddenOnThisViewport(): boolean {
    try {
      if (typeof window === 'undefined') return false
      if (typeof window.getComputedStyle !== 'function') return false
      return window.getComputedStyle(this).display === 'none'
    } catch {
      return false
    }
  }

  pause(): void {
    const context = { scriptName: SCRIPT_NAME, operation: 'pause' }
    addScriptBreadcrumb(context)

    try {
      this.timeline?.pause()
      this.setAnimationState('paused')
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  resume(): void {
    const context = { scriptName: SCRIPT_NAME, operation: 'resume' }
    addScriptBreadcrumb(context)

    try {
      this.setAnimationState('playing')
      this.syncPlaybackWithVisibility()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private setupVisibilityHandlers(): void {
    if (typeof document === 'undefined') return

    try {
      this.isPageVisible = document.visibilityState !== 'hidden'
      document.addEventListener('visibilitychange', this.visibilityChangeHandler)

      const IntersectionObserverCtor = (
        globalThis as unknown as { IntersectionObserver?: typeof IntersectionObserver }
      ).IntersectionObserver

      if (typeof IntersectionObserverCtor !== 'function') return

      this.intersectionObserver = new IntersectionObserverCtor(
        entries => {
          const entry = entries[0]
          // Auto-play as long as *any* part of the animation is visible.
          this.isInViewport = Boolean(entry?.isIntersecting)
          this.syncPlaybackWithVisibility()
        },
        { threshold: [0] }
      )

      this.intersectionObserver.observe(this)
    } catch {
      // Best effort only
    }
  }

  private teardownVisibilityHandlers(): void {
    try {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
      }

      this.intersectionObserver?.disconnect()
      this.intersectionObserver = undefined
      this.isInViewport = true
      this.isPageVisible = true
    } catch {
      // Best effort only
    }
  }

  private syncPlaybackWithVisibility(): void {
    if (!this.timeline) return

    try {
      if (!this.isPageVisible || !this.isInViewport) {
        this.timeline.pause()
        return
      }

      if (this.getAnimationState() === 'playing') {
        this.timeline.play()
      }
    } catch {
      // Best effort only
    }
  }

  private teardown(): void {
    if (!this.initialized) return

    const context = { scriptName: SCRIPT_NAME, operation: 'teardown' }
    addScriptBreadcrumb(context)

    try {
      this.teardownVisibilityHandlers()
      this.animationController?.destroy()
      this.animationController = undefined

      if (this.timeline) {
        this.timeline.kill()
        this.timeline = null
      }

      this.resetToggleButton()
      this.removeAttribute('data-animation-state')
      this.initialized = false
      this.animationReady = false
      this.deferredInitFrames = 0
      if (this.deferredInitRafId !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(this.deferredInitRafId)
      }
      this.deferredInitRafId = null
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private setAnimationState(state: AnimationPlayState): void {
    this.setAttribute('data-animation-state', state)
    this.updateToggleButton(state)
  }

  private updateToggleButton(state: AnimationPlayState): void {
    if (!this.toggleButton) return

    this.toggleButton.setAttribute('aria-pressed', state === 'paused' ? 'true' : 'false')
    this.toggleButton.setAttribute(
      'aria-label',
      state === 'paused' ? 'Play animation' : 'Pause animation'
    )
    this.toggleButton.dataset['animationState'] = state

    const pauseIcon = queryAnimationTogglePauseIcon(this.toggleButton) as HTMLElement | null
    const playIcon = queryAnimationTogglePlayIcon(this.toggleButton) as HTMLElement | null

    if (pauseIcon) pauseIcon.style.display = state === 'paused' ? 'none' : 'flex'
    if (playIcon) playIcon.style.display = state === 'playing' ? 'none' : 'flex'
  }

  private resetToggleButton(): void {
    if (!this.toggleButton) return

    this.toggleButton.removeAttribute('data-animation-state')
    this.toggleButton.setAttribute('aria-label', 'Pause animation')
    this.toggleButton.setAttribute('aria-pressed', 'false')

    const pauseIcon = queryAnimationTogglePauseIcon(this.toggleButton) as HTMLElement | null
    const playIcon = queryAnimationTogglePlayIcon(this.toggleButton) as HTMLElement | null

    if (pauseIcon) pauseIcon.style.display = 'flex'
    if (playIcon) playIcon.style.display = 'none'

    this.toggleButton = null
  }

  private handleToggleClick(event: Event): void {
    event.preventDefault()

    if (!this.toggleButton) return

    this.setupAnimationAndController()

    const state = this.getAnimationState()

    if (state === 'playing') {
      if (this.animationController) {
        this.animationController.requestPause()
      } else {
        this.pause()
      }
      return
    }

    if (this.animationController) {
      this.animationController.requestPlay()
      return
    }

    this.resume()
  }

  private getAnimationState(): AnimationPlayState {
    const state = this.getAttribute('data-animation-state') as AnimationPlayState | null
    return state ?? 'playing'
  }

  /**
   * Measures each primary edge `<path>` and applies `stroke-dash` properties so
   * it can be revealed with a draw-in effect (animating `strokeDashoffset` → 0).
   * Cross-dependency edges use the SVG `stroke-dasharray="6 3"` dashed style, so
   * they are revealed with opacity instead of dash-offset.
   */
  private prepareEdgePaths(): void {
    const primaryEdgeIds = ['tf-edge-vpc', 'tf-edge-iam', 'tf-edge-s3']

    for (const id of primaryEdgeIds) {
      const path = queryEdgePath(this, id)
      if (path) {
        const len = path.getTotalLength()
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
      }
    }
  }

  private startAnimation(): void {
    if (typeof document === 'undefined') return
    if (document.getElementById('terraformAnimation') === null) return
    if (this.timeline) return

    const context = { scriptName: SCRIPT_NAME, operation: 'startAnimation' }
    addScriptBreadcrumb(context)

    try {
      // --- Selector groups ---
      const primaryArrows = '#tf-arrow-vpc, #tf-arrow-iam, #tf-arrow-s3'
      const crossEdges = '#tf-edge-vpc-eks, #tf-edge-iam-eks, #tf-edge-vpc-rds, #tf-edge-iam-rds'
      const crossArrows = '#tf-arrow-vpc-eks, #tf-arrow-iam-eks, #tf-arrow-vpc-rds, #tf-arrow-iam-rds'
      const allChecks =
        '#tf-check-root, #tf-check-vpc, #tf-check-iam, #tf-check-s3, #tf-check-eks, #tf-check-rds'
      const termLines =
        '#tf-term-line-1, #tf-term-line-2, #tf-term-line-3, #tf-term-line-4, ' +
        '#tf-term-line-5, #tf-term-line-6, #tf-term-line-7, #tf-term-line-8'

      // --- Initial states ---
      gsap.set(
        [
          '#tf-node-root', '#tf-node-vpc', '#tf-node-iam', '#tf-node-s3',
          '#tf-node-eks', '#tf-node-rds',
        ],
        { transformOrigin: '50% 50%' }
      )

      // Hide arrowheads and cross-dependency edge paths
      gsap.set(`${primaryArrows}, ${crossArrows}`, { opacity: 0 })
      gsap.set(crossEdges, { opacity: 0 })

      // Set up primary edge paths for stroke-dash draw-in
      this.prepareEdgePaths()

      // Make SVG visible (starts as visibility:hidden to prevent FOUC)
      gsap.set('#terraformAnimation', { visibility: 'visible' })

      // --- Build timeline ---
      this.timeline = gsap
        .timeline({
          defaults: { duration: 0.8, immediateRender: false },
          delay: 0.8,
          paused: true,
          repeat: -1,
          repeatDelay: 0.6,
          yoyo: false,
        })
        .timeScale(TIMESCALE)

        // ===== Phase 1: Root node appears =====
        .from('#tf-node-root', {
          scale: 0.5,
          opacity: 0,
          duration: 0.6,
          ease: 'back(1.7)',
        })

        // ===== Phase 2: Primary edges draw in =====
        .to('#tf-edge-vpc', { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' })
        .to('#tf-edge-iam', { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, '-=0.35')
        .to('#tf-edge-s3', { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, '-=0.35')
        .to(primaryArrows, { opacity: 1, duration: 0.15 }, '-=0.1')

        // ===== Phase 3: Row 1 nodes pop in =====
        .from('#tf-node-vpc', {
          scale: 0, opacity: 0, duration: 0.5, ease: 'back(2)',
        }, '-=0.05')
        .from('#tf-node-iam', {
          scale: 0, opacity: 0, duration: 0.5, ease: 'back(2)',
        }, '-=0.3')
        .from('#tf-node-s3', {
          scale: 0, opacity: 0, duration: 0.5, ease: 'back(2)',
        }, '-=0.3')

        // ===== Phase 4: Cross-dependency edges fade in =====
        .to('#tf-edge-vpc-eks', { opacity: 1, duration: 0.35 }, '+=0.15')
        .to('#tf-edge-iam-eks', { opacity: 1, duration: 0.35 }, '-=0.25')
        .to('#tf-edge-vpc-rds', { opacity: 1, duration: 0.35 }, '-=0.25')
        .to('#tf-edge-iam-rds', { opacity: 1, duration: 0.35 }, '-=0.25')
        .to(crossArrows, { opacity: 1, duration: 0.15 }, '-=0.1')

        // ===== Phase 5: Row 2 nodes pop in =====
        .from('#tf-node-eks', {
          scale: 0, opacity: 0, duration: 0.5, ease: 'back(2)',
        }, '-=0.05')
        .from('#tf-node-rds', {
          scale: 0, opacity: 0, duration: 0.5, ease: 'back(2)',
        }, '-=0.25')

        // ===== Phase 6: Checkmarks cascade with green flash borders =====
        .to('#tf-check-root', { opacity: 1, duration: 0.25 }, '+=0.3')

        .to('#tf-check-vpc', { opacity: 1, duration: 0.25 }, '+=0.06')
        .to('#tf-flash-vpc', { opacity: 1, duration: 0.06 }, '-=0.15')
        .to('#tf-flash-vpc', { opacity: 0, duration: 0.2 })

        .to('#tf-check-iam', { opacity: 1, duration: 0.25 }, '-=0.1')
        .to('#tf-flash-iam', { opacity: 1, duration: 0.06 }, '-=0.15')
        .to('#tf-flash-iam', { opacity: 0, duration: 0.2 })

        .to('#tf-check-s3', { opacity: 1, duration: 0.25 }, '-=0.1')
        .to('#tf-flash-s3', { opacity: 1, duration: 0.06 }, '-=0.15')
        .to('#tf-flash-s3', { opacity: 0, duration: 0.2 })

        .to('#tf-check-eks', { opacity: 1, duration: 0.25 }, '-=0.1')
        .to('#tf-flash-eks', { opacity: 1, duration: 0.06 }, '-=0.15')
        .to('#tf-flash-eks', { opacity: 0, duration: 0.2 })

        .to('#tf-check-rds', { opacity: 1, duration: 0.25 }, '-=0.1')
        .to('#tf-flash-rds', { opacity: 1, duration: 0.06 }, '-=0.15')
        .to('#tf-flash-rds', { opacity: 0, duration: 0.2 })

        // ===== Phase 7: Terminal output lines appear =====
        .to('#tf-term-line-1', { opacity: 1, duration: 0.12 }, '+=0.3')
        .to('#tf-term-line-2', { opacity: 1, duration: 0.12 }, '+=0.06')
        .to('#tf-term-line-3', { opacity: 1, duration: 0.12 }, '+=0.15')
        .to('#tf-term-line-4', { opacity: 1, duration: 0.12 }, '+=0.06')
        .to('#tf-term-line-5', { opacity: 1, duration: 0.12 }, '+=0.15')
        .to('#tf-term-line-6', { opacity: 1, duration: 0.12 }, '+=0.06')
        .to('#tf-term-line-7', { opacity: 1, duration: 0.12 }, '+=0.04')
        .to('#tf-term-line-8', { opacity: 1, duration: 0.12 }, '+=0.04')

        // ===== Phase 8: "Apply complete!" =====
        .to('#tf-term-complete', { opacity: 1, duration: 0.4, ease: 'power2.out' }, '+=0.3')

        // ===== Phase 9: Cursor blinks =====
        .to('#tf-cursor', { opacity: 1, duration: 0.08 }, '+=0.2')
        .to('#tf-cursor', { opacity: 0, duration: 0.08 }, '+=0.35')
        .to('#tf-cursor', { opacity: 1, duration: 0.08 }, '+=0.35')
        .to('#tf-cursor', { opacity: 0, duration: 0.08 }, '+=0.35')

        // ===== Phase 10: Hold on completed state =====
        .to({}, { duration: 2.5 })

        // ===== Phase 11: Dissolve for clean loop =====
        .to('#tf-cursor', { opacity: 0, duration: 0.1 })
        .to(`${termLines}, #tf-term-complete`, { opacity: 0, duration: 0.4 }, '-=0.05')
        .to(allChecks, { opacity: 0, duration: 0.3 }, '-=0.3')
        .to('#tf-node-eks, #tf-node-rds', { opacity: 0, scale: 0.8, duration: 0.4 }, '-=0.2')
        .to('#tf-edges-cross', { opacity: 0, duration: 0.3 }, '-=0.3')
        .to('#tf-node-vpc, #tf-node-iam, #tf-node-s3', {
          opacity: 0, scale: 0.8, duration: 0.4,
        }, '-=0.2')
        .to('#tf-edges-primary', { opacity: 0, duration: 0.3 }, '-=0.3')
        .to('#tf-node-root', { opacity: 0, scale: 0.8, duration: 0.3 }, '-=0.2')
    } catch (error) {
      handleScriptError(error, context)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'terraform-animation': TerraformAnimationElement
  }
}

export const registerTerraformAnimationWebComponent = (tagName: string = COMPONENT_TAG_NAME) => {
  if (typeof window === 'undefined') return
  defineCustomElement(tagName, TerraformAnimationElement)
}

export const webComponentModule: WebComponentModule<TerraformAnimationElement> = {
  registeredName: COMPONENT_TAG_NAME,
  componentCtor: TerraformAnimationElement,
  registerWebComponent: registerTerraformAnimationWebComponent,
}
