import EmblaCarousel, { type EmblaCarouselType, type EmblaOptionsType } from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { isType1Element } from '@components/scripts/assertions/elements'
import { defineCustomElement } from '@components/scripts/utils'
import {
  createAnimationController,
  type AnimationControllerHandle,
  type AnimationPlayState,
} from '@components/scripts/store'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  getTestimonialsEmblaSetupElements,
  queryTestimonialsAutoplayPauseIcon,
  queryTestimonialsAutoplayPlayIcon,
  queryTestimonialsAutoplayToggleBtn,
  queryTestimonialsDotsContainer,
  queryTestimonialsNextBtn,
  queryTestimonialsPrevBtn,
  queryTestimonialsSlides,
} from './selectors'

const SCRIPT_NAME = 'TestimonialsCarouselElement'

const logForE2E = (
  level: 'info' | 'error',
  message: string,
  details?: Record<string, unknown>
): void => {
  if (typeof window === 'undefined' || window.isPlaywrightControlled !== true) return
  const payload = details ? [`[testimonials] ${message}`, details] : [`[testimonials] ${message}`]
  console[level](...payload)
}

const EMBLA_OPTIONS: EmblaOptionsType = {
  loop: true,
  align: 'center',
  skipSnaps: false,
  dragFree: false,
}

const AUTOPLAY_OPTIONS = {
  delay: 6000,
  stopOnInteraction: true,
  stopOnMouseEnter: true,
  playOnInit: false,
}

type DebugEmblaElement = HTMLElement & { __emblaApi__?: EmblaCarouselType }
type TimerHandle = ReturnType<typeof setTimeout> | number

export class TestimonialsCarouselElement extends HTMLElement {
  private emblaApi: EmblaCarouselType | null = null
  private autoplayPlugin: ReturnType<typeof Autoplay> | null = null
  private emblaRoot: DebugEmblaElement | null = null
  private viewport: HTMLElement | null = null
  private dotsContainer: HTMLElement | null = null
  private prevBtn: HTMLButtonElement | null = null
  private nextBtn: HTMLButtonElement | null = null
  private autoplayToggleBtn: HTMLButtonElement | null = null
  private viewportId: string | null = null
  private initialized = false
  private animationController: AnimationControllerHandle | undefined
  private pendingAutoplayState: AnimationPlayState | null = null
  private hasAutoplaySupport = false
  private autoplayReady = false
  private autoplayReadyScheduled = false
  private autoplayReadyTimer: TimerHandle | null = null
  private intersectionObserver: IntersectionObserver | undefined
  private isFullyInViewport = true
  private requestedAutoplayState: AnimationPlayState = 'paused'
  private readonly animationInstanceId: string
  private readonly domReadyHandler = () => {
    document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
    this.initialize()
  }
  private readonly autoplayPlayHandler = () => this.setAutoplayState('playing')
  private readonly autoplayStopHandler = () => this.setAutoplayState('paused')

  private static instanceCounter = 0

  constructor() {
    super()
    TestimonialsCarouselElement.instanceCounter += 1
    this.animationInstanceId = `testimonials-${TestimonialsCarouselElement.instanceCounter}`
  }

  connectedCallback(): void {
    if (typeof document === 'undefined') return

    const context = { scriptName: SCRIPT_NAME, operation: 'connectedCallback' }
    addScriptBreadcrumb(context)

    try {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', this.domReadyHandler, { once: true })
        return
      }
      this.initialize()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  disconnectedCallback(): void {
    if (typeof document === 'undefined') return
    document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
    this.teardown()
  }

  private initialize(): void {
    if (this.initialized || typeof document === 'undefined') return

    const context = { scriptName: SCRIPT_NAME, operation: 'initialize' }
    addScriptBreadcrumb(context)
    logForE2E('info', 'initialize:start', {
      id: this.animationInstanceId,
      existingReadyState: this.getAttribute('data-carousel-ready') ?? 'missing',
    })

    try {
      const { emblaRoot, viewport } = getTestimonialsEmblaSetupElements(this)

      this.emblaRoot = emblaRoot as unknown as DebugEmblaElement
      this.viewport = viewport
      this.dotsContainer = queryTestimonialsDotsContainer(this)
      this.prevBtn = queryTestimonialsPrevBtn(this)
      this.nextBtn = queryTestimonialsNextBtn(this)
      this.autoplayToggleBtn = queryTestimonialsAutoplayToggleBtn(this)

      const slideCount = queryTestimonialsSlides(this).length
      const requestedAutoplay = slideCount > 1 ? Autoplay({ ...AUTOPLAY_OPTIONS }) : null
      this.autoplayReady = false
      this.autoplayReadyScheduled = false
      const plugins = requestedAutoplay ? [requestedAutoplay] : []
      this.emblaApi = EmblaCarousel(this.viewport, EMBLA_OPTIONS, plugins)
      this.emblaRoot.__emblaApi__ = this.emblaApi
      const emblaSnapCount = this.emblaApi.scrollSnapList().length
      const supportsAutoplay = slideCount > 1 && emblaSnapCount > 1
      this.hasAutoplaySupport = supportsAutoplay
      this.autoplayPlugin = supportsAutoplay ? requestedAutoplay : null
      this.setAutoplayState('paused')
      this.requestedAutoplayState = 'paused'

      if (this.autoplayPlugin) {
        const emblaWithEvents = this.emblaApi as EmblaCarouselType & {
          on: (_event: string, _handler: () => void) => EmblaCarouselType
          off: (_event: string, _handler: () => void) => EmblaCarouselType
        }

        emblaWithEvents.on('autoplay:play', this.autoplayPlayHandler)
        emblaWithEvents.on('autoplay:stop', this.autoplayStopHandler)
      }

      this.setupNavigationButtons()
      this.setupDotsNavigation()
      this.setupAutoplayToggle()

      this.initialized = true
      this.setAttribute('data-carousel-ready', 'true')
      logForE2E('info', 'initialize:complete', {
        id: this.animationInstanceId,
        slideCount,
        supportsAutoplay: this.hasAutoplaySupport,
      })

      if (this.hasAutoplaySupport) {
        this.registerAnimationLifecycle()
        this.setupViewportObserver()
        this.scheduleAutoplayReady()
      }
    } catch (error) {
      this.teardown()
      logForE2E('error', 'initialize:failed', {
        id: this.animationInstanceId,
        message: error instanceof Error ? error.message : String(error),
      })
      handleScriptError(error, context)
    }
  }

  private teardown(): void {
    this.teardownViewportObserver()
    if (this.emblaApi) {
      const emblaWithEvents = this.emblaApi as EmblaCarouselType & {
        off: (_event: string, _handler: () => void) => EmblaCarouselType
      }

      if (this.autoplayPlugin) {
        emblaWithEvents.off('autoplay:play', this.autoplayPlayHandler)
        emblaWithEvents.off('autoplay:stop', this.autoplayStopHandler)
      }
      this.emblaApi.destroy()
    }

    if (this.emblaRoot && '__emblaApi__' in this.emblaRoot) {
      delete this.emblaRoot.__emblaApi__
    }

    this.emblaApi = null
    this.autoplayPlugin = null
    this.initialized = false
    this.removeAttribute('data-carousel-ready')
    this.removeAttribute('data-carousel-autoplay')
    this.animationController?.destroy()
    this.animationController = undefined
    this.pendingAutoplayState = null
    this.hasAutoplaySupport = false
    if (this.autoplayReadyTimer) {
      clearTimeout(this.autoplayReadyTimer)
      this.autoplayReadyTimer = null
    }
    this.autoplayReadyScheduled = false
    this.autoplayReady = false

    if (this.dotsContainer) {
      this.dotsContainer.innerHTML = ''
    }
  }

  private setupNavigationButtons(): void {
    if (!this.emblaApi || !this.prevBtn || !this.nextBtn) return

    this.ensureViewportId()

    const updateButtonStates = () => {
      if (!this.emblaApi || !this.prevBtn || !this.nextBtn) return

      if (this.emblaApi.canScrollPrev()) {
        this.prevBtn.removeAttribute('disabled')
        this.prevBtn.classList.remove('opacity-30', 'cursor-not-allowed')
      } else {
        this.prevBtn.setAttribute('disabled', 'true')
        this.prevBtn.classList.add('opacity-30', 'cursor-not-allowed')
      }

      if (this.emblaApi.canScrollNext()) {
        this.nextBtn.removeAttribute('disabled')
        this.nextBtn.classList.remove('opacity-30', 'cursor-not-allowed')
      } else {
        this.nextBtn.setAttribute('disabled', 'true')
        this.nextBtn.classList.add('opacity-30', 'cursor-not-allowed')
      }
    }

    addButtonEventListeners(
      this.prevBtn,
      () => {
        try {
          this.emblaApi?.scrollPrev()
        } catch (error) {
          handleScriptError(error, { scriptName: SCRIPT_NAME, operation: 'scrollPrev' })
        }
      },
      this
    )

    addButtonEventListeners(
      this.nextBtn,
      () => {
        try {
          this.emblaApi?.scrollNext()
        } catch (error) {
          handleScriptError(error, { scriptName: SCRIPT_NAME, operation: 'scrollNext' })
        }
      },
      this
    )

    if (this.viewportId) {
      this.prevBtn.setAttribute('aria-controls', this.viewportId)
      this.nextBtn.setAttribute('aria-controls', this.viewportId)
    }

    this.emblaApi.on('select', updateButtonStates)
    this.emblaApi.on('reInit', updateButtonStates)
    updateButtonStates()
  }

  private setupDotsNavigation(): void {
    if (!this.emblaApi || !this.dotsContainer) return

    this.ensureViewportId()

    const dotsContainer = this.dotsContainer
    const ownerDocument = this.ownerDocument ?? document
    let dots: HTMLButtonElement[] = []

    const rebuildDots = () => {
      if (!this.emblaApi) return
      dotsContainer.innerHTML = ''
      dots = []

      this.emblaApi.scrollSnapList().forEach((_, index) => {
        const dot = ownerDocument.createElement('button')
        dot.type = 'button'
        dot.dataset['index'] = String(index)
        dot.className =
          'embla__dot w-3 h-3 rounded-full bg-[color:var(--color-text-offset)] transition-all duration-300 hover:bg-[color:var(--color-primary)]'
        dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`)

        if (this.viewportId) {
          dot.setAttribute('aria-controls', this.viewportId)
        }

        addButtonEventListeners(
          dot,
          () => {
            try {
              this.emblaApi?.scrollTo(index)
            } catch (error) {
              handleScriptError(error, { scriptName: SCRIPT_NAME, operation: 'scrollToDot' })
            }
          },
          this
        )

        dotsContainer.appendChild(dot)
        dots.push(dot)
      })
    }

    const updateDots = () => {
      if (!this.emblaApi) return
      const selectedIndex = this.emblaApi.selectedScrollSnap()

      dots.forEach((dot, index) => {
        if (index === selectedIndex) {
          dot.classList.add('bg-[color:var(--color-primary)]', 'w-6')
          dot.classList.remove('bg-[color:var(--color-text-offset)]', 'w-3')
          dot.setAttribute('aria-current', 'true')
        } else {
          dot.classList.remove('bg-[color:var(--color-primary)]', 'w-6')
          dot.classList.add('bg-[color:var(--color-text-offset)]', 'w-3')
          dot.removeAttribute('aria-current')
        }
      })
    }

    rebuildDots()
    updateDots()

    this.emblaApi.on('select', updateDots)
    this.emblaApi.on('reInit', () => {
      rebuildDots()
      updateDots()
    })
  }

  pause(): void {
    try {
      this.requestedAutoplayState = 'paused'
      this.syncAutoplayWithViewport()
    } catch (error) {
      handleScriptError(error, { scriptName: SCRIPT_NAME, operation: 'pause' })
    }
  }

  resume(): void {
    try {
      this.requestedAutoplayState = 'playing'
      this.syncAutoplayWithViewport()
    } catch (error) {
      handleScriptError(error, { scriptName: SCRIPT_NAME, operation: 'resume' })
    }
  }

  private setupViewportObserver(): void {
    if (typeof document === 'undefined') return
    if (this.intersectionObserver) return

    try {
      const IntersectionObserverCtor = (
        globalThis as unknown as { IntersectionObserver?: typeof IntersectionObserver }
      ).IntersectionObserver

      if (typeof IntersectionObserverCtor !== 'function') return

      this.intersectionObserver = new IntersectionObserverCtor(
        entries => {
          const entry = entries[0]
          const ratio = entry?.intersectionRatio ?? 0
          this.isFullyInViewport = Boolean(entry?.isIntersecting && ratio >= 0.999)
          this.syncAutoplayWithViewport()
        },
        { threshold: [0, 0.999] }
      )

      const observedTarget = this.emblaRoot ?? this
      this.intersectionObserver.observe(observedTarget)
    } catch {
      // Best effort only
    }
  }

  private teardownViewportObserver(): void {
    try {
      this.intersectionObserver?.disconnect()
      this.intersectionObserver = undefined
      this.isFullyInViewport = true
    } catch {
      // Best effort only
    }
  }

  private syncAutoplayWithViewport(): void {
    const shouldPlay = this.requestedAutoplayState === 'playing' && this.isFullyInViewport
    this.updateAutoplayState(shouldPlay ? 'playing' : 'paused')
  }

  private setAutoplayState(state: 'playing' | 'paused'): void {
    this.setAttribute('data-carousel-autoplay', state)
    this.syncAutoplayToggleButton(state)
  }

  private setupAutoplayToggle(): void {
    if (!this.autoplayToggleBtn) {
      return
    }

    this.ensureViewportId()
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
    if (!this.autoplayToggleBtn) {
      return
    }

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

  private ensureViewportId(): void {
    if (!this.viewport || this.viewportId) {
      return
    }

    const existingId = this.viewport.getAttribute('id')
    const nextId =
      existingId && existingId.length > 0 ? existingId : `${this.animationInstanceId}-viewport`
    this.viewport.setAttribute('id', nextId)
    this.viewportId = nextId
  }

  private updateAutoplayState(state: AnimationPlayState): void {
    if (
      !this.hasAutoplaySupport ||
      !this.autoplayPlugin ||
      !this.emblaApi ||
      !this.initialized ||
      !this.autoplayReady
    ) {
      if (this.hasAutoplaySupport) {
        this.pendingAutoplayState = state
        this.setAutoplayState(state)
      } else {
        this.pendingAutoplayState = null
        this.setAutoplayState('paused')
      }
      return
    }

    this.pendingAutoplayState = null
    if (state === 'playing') {
      this.autoplayPlugin.play()
    } else {
      this.autoplayPlugin.stop()
    }
    this.setAutoplayState(state)
  }

  private flushPendingAutoplayState(): void {
    if (!this.pendingAutoplayState || !this.autoplayReady || !this.autoplayPlugin) return

    const pendingState = this.pendingAutoplayState
    this.pendingAutoplayState = null

    try {
      this.updateAutoplayState(pendingState)
    } catch (error) {
      handleScriptError(error, { scriptName: SCRIPT_NAME, operation: 'flushAutoplay' })
    }
  }

  private registerAnimationLifecycle(): void {
    if (this.animationController || !this.hasAutoplaySupport) return
    this.animationController = createAnimationController({
      animationId: 'testimonials-carousel',
      instanceId: this.animationInstanceId,
      debugLabel: SCRIPT_NAME,
      onPlay: () => {
        this.resume()
      },
      onPause: () => {
        this.pause()
      },
    })
  }

  private scheduleAutoplayReady(): void {
    if (this.autoplayReadyScheduled || !this.autoplayPlugin) return
    this.autoplayReadyScheduled = true

    const markReady = () => {
      this.autoplayReadyScheduled = false
      this.autoplayReadyTimer = null
      if (!this.initialized || !this.autoplayPlugin) return
      this.autoplayReady = true
      this.flushPendingAutoplayState()
    }

    if (typeof window === 'undefined') {
      markReady()
      return
    }

    this.autoplayReadyTimer = window.setTimeout(markReady, 0)
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
