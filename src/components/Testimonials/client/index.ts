import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { isType1Element } from '@components/scripts/assertions/elements'
import { defineCustomElement } from '@components/scripts/utils'
import { createE2ELogger, EmblaCarouselBase } from '@components/scripts/embla'
import type { EmblaCarouselConfig, EmblaElementHandles } from '@components/scripts/embla'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  getTestimonialsEmblaSetupElements,
  hasTestimonialsFocusVisibleSlide,
  queryTestimonialsAutoplayPauseIcon,
  queryTestimonialsAutoplayPlayIcon,
  queryTestimonialsAutoplayToggleBtn,
  queryTestimonialsDotsContainer,
  queryTestimonialsNextBtn,
  queryTestimonialsPrevBtn,
  queryTestimonialsSlides,
} from './selectors'

const SCRIPT_NAME = 'TestimonialsCarouselElement'
const logForE2E = createE2ELogger('testimonials')

export class TestimonialsCarouselElement extends EmblaCarouselBase {
  private autoplayToggleBtn: HTMLButtonElement | null = null
  private viewportId: string | null = null

  // ────────────────────── Base class abstract implementations ──────────────────────

  protected getConfig(): EmblaCarouselConfig {
    return {
      emblaOptions: {
        loop: true,
        align: 'center',
        skipSnaps: false,
        dragFree: false,
      },
      autoplayOptions: {
        delay: 6000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
        playOnInit: false,
      },
      animationId: 'testimonials-carousel',
      scriptName: SCRIPT_NAME,
      logPrefix: 'testimonials',
    }
  }

  protected queryElements(): EmblaElementHandles {
    const { emblaRoot, viewport } = getTestimonialsEmblaSetupElements(this)
    return {
      emblaRoot: emblaRoot as EmblaElementHandles['emblaRoot'],
      viewport,
      slideCount: queryTestimonialsSlides(this).length,
      dotsContainer: queryTestimonialsDotsContainer(this),
      prevBtn: queryTestimonialsPrevBtn(this),
      nextBtn: queryTestimonialsNextBtn(this),
    }
  }

  protected override hasFocusVisibleSlide(): boolean {
    return hasTestimonialsFocusVisibleSlide(this)
  }

  protected override isFocusInsideSlide(target: HTMLElement): boolean {
    return target.closest('[data-testimonials-slide]') !== null
  }

  // ────────────────────── Testimonials-specific behaviour ──────────────────────

  protected override onInitialized(): void {
    this.autoplayToggleBtn = queryTestimonialsAutoplayToggleBtn(this)
    this.ensureViewportId()
    this.setupAriaControls()
    this.setupAutoplayToggle()
  }

  protected override onTeardown(): void {
    this.autoplayToggleBtn = null
    this.viewportId = null
  }

  protected override onAutoplayStateChange(state: 'playing' | 'paused'): void {
    this.syncAutoplayToggleButton(state)
  }

  // ────────────────────── Dot styling overrides ──────────────────────

  protected override applyDotActiveStyle(dot: HTMLButtonElement): void {
    dot.classList.add('bg-primary', 'w-6')
    dot.classList.remove('bg-content-active', 'w-3')
    dot.setAttribute('aria-current', 'true')
  }

  protected override applyDotInactiveStyle(dot: HTMLButtonElement): void {
    dot.classList.remove('bg-primary', 'w-6')
    dot.classList.add('bg-content-active', 'w-3')
    dot.removeAttribute('aria-current')
  }

  protected override getDotAriaLabel(index: number): string {
    return `Go to testimonial ${index + 1}`
  }

  // ────────────────────── Private helpers ──────────────────────

  private ensureViewportId(): void {
    const vp = this.viewport
    if (!vp || this.viewportId) return

    const existingId = vp.getAttribute('id')
    const nextId =
      existingId && existingId.length > 0 ? existingId : `${this.animationInstanceId}-viewport`
    vp.setAttribute('id', nextId)
    this.viewportId = nextId
  }

  private setupAriaControls(): void {
    if (!this.viewportId) return
    this.prevBtn?.setAttribute('aria-controls', this.viewportId)
    this.nextBtn?.setAttribute('aria-controls', this.viewportId)
  }

  private setupAutoplayToggle(): void {
    if (!this.autoplayToggleBtn) return

    if (this.viewportId) {
      this.autoplayToggleBtn.setAttribute('aria-controls', this.viewportId)
    }

    addButtonEventListeners(
      this.autoplayToggleBtn,
      () => {
        const state = this.getAttribute('data-carousel-autoplay')
        if (state === 'playing') {
          this.pause()
          return
        }
        this.resume()
      },
      this
    )

    const initialState =
      (this.getAttribute('data-carousel-autoplay') as 'playing' | 'paused' | null) ?? 'paused'
    this.syncAutoplayToggleButton(initialState)
  }

  private syncAutoplayToggleButton(state: 'playing' | 'paused'): void {
    if (!this.autoplayToggleBtn) return

    const pauseIcon = queryTestimonialsAutoplayPauseIcon(this.autoplayToggleBtn)
    const playIcon = queryTestimonialsAutoplayPlayIcon(this.autoplayToggleBtn)

    if (state === 'playing') {
      this.autoplayToggleBtn.setAttribute('aria-label', 'Pause testimonials')
      this.autoplayToggleBtn.setAttribute('aria-pressed', 'false')
      if (isType1Element(pauseIcon)) pauseIcon.classList.remove('hidden')
      if (isType1Element(playIcon)) playIcon.classList.add('hidden')
      return
    }

    this.autoplayToggleBtn.setAttribute('aria-label', 'Play testimonials')
    this.autoplayToggleBtn.setAttribute('aria-pressed', 'true')
    if (isType1Element(pauseIcon)) pauseIcon.classList.add('hidden')
    if (isType1Element(playIcon)) playIcon.classList.remove('hidden')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'testimonials-carousel': TestimonialsCarouselElement
  }
}

export const registerTestimonialsWebComponent = (tagName = 'testimonials-carousel'): void => {
  if (typeof window === 'undefined') return
  logForE2E('info', 'register:invoke', { tagName })
  defineCustomElement(tagName, TestimonialsCarouselElement)
}

export const webComponentModule: WebComponentModule<TestimonialsCarouselElement> = {
  registeredName: 'testimonials-carousel',
  componentCtor: TestimonialsCarouselElement,
  registerWebComponent: registerTestimonialsWebComponent,
}
