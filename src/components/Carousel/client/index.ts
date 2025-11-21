import EmblaCarousel, { type EmblaCarouselType, type EmblaOptionsType } from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import { addButtonEventListeners } from '@components/scripts/elementListeners'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'

const SCRIPT_NAME = 'CarouselElement'

const EMBLA_OPTIONS: EmblaOptionsType = {
  loop: true,
  align: 'start',
  skipSnaps: false,
  dragFree: false,
}

const AUTOPLAY_OPTIONS = {
  delay: 4000,
  stopOnInteraction: true,
  stopOnMouseEnter: true,
}

type DebugEmblaElement = HTMLElement & { __emblaApi__?: EmblaCarouselType }

export class CarouselElement extends HTMLElement {
  private emblaApi: EmblaCarouselType | null = null
  private autoplayPlugin: ReturnType<typeof Autoplay> | null = null
  private emblaRoot: DebugEmblaElement | null = null
  private viewport: HTMLElement | null = null
  private dotsContainer: HTMLElement | null = null
  private prevBtn: HTMLButtonElement | null = null
  private nextBtn: HTMLButtonElement | null = null
  private initialized = false
  private readonly domReadyHandler = () => {
    document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
    this.initialize()
  }
  private readonly autoplayPlayHandler = () => this.setAutoplayState('playing')
  private readonly autoplayStopHandler = () => this.setAutoplayState('paused')

  private static readonly instances = new Set<CarouselElement>()
  private static visibilityHandler: (() => void) | undefined

  connectedCallback(): void {
    if (typeof document === 'undefined') return

    const context = { scriptName: SCRIPT_NAME, operation: 'connectedCallback' }
    addScriptBreadcrumb(context)

    try {
      CarouselElement.registerInstance(this)
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
    CarouselElement.unregisterInstance(this)
  }

  private initialize(): void {
    if (this.initialized) return

    const context = { scriptName: SCRIPT_NAME, operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      this.emblaRoot = this.querySelector('.embla') as DebugEmblaElement | null
      this.viewport = this.querySelector('.embla__viewport')
      this.dotsContainer = this.querySelector('.embla__dots')
      this.prevBtn = this.querySelector('.embla__button--prev')
      this.nextBtn = this.querySelector('.embla__button--next')

      if (!this.emblaRoot || !this.viewport) {
        throw new ClientScriptError('CarouselElement: Missing required DOM parts for initialization.')
      }

      this.autoplayPlugin = Autoplay({ ...AUTOPLAY_OPTIONS })
      this.emblaApi = EmblaCarousel(this.viewport, EMBLA_OPTIONS, [this.autoplayPlugin])
      this.emblaRoot.__emblaApi__ = this.emblaApi
      this.setAutoplayState('paused')

      const emblaWithEvents = this.emblaApi as EmblaCarouselType & {
        on: (_event: string, _handler: () => void) => EmblaCarouselType
      }

      emblaWithEvents.on('autoplay:play', this.autoplayPlayHandler)
      emblaWithEvents.on('autoplay:stop', this.autoplayStopHandler)

      this.setupNavigationButtons()
      this.setupDotsNavigation()

      this.initialized = true
      this.setAttribute('data-carousel-ready', 'true')
    } catch (error) {
      this.teardown()
      handleScriptError(error, context)
    }
  }

  private teardown(): void {
    if (this.emblaApi) {
      const emblaWithEvents = this.emblaApi as EmblaCarouselType & {
        off: (_event: string, _handler: () => void) => EmblaCarouselType
      }

      emblaWithEvents.off('autoplay:play', this.autoplayPlayHandler)
      emblaWithEvents.off('autoplay:stop', this.autoplayStopHandler)
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

    if (this.dotsContainer) {
      this.dotsContainer.innerHTML = ''
    }
  }

  private setupNavigationButtons(): void {
    if (!this.emblaApi || !this.prevBtn || !this.nextBtn) return

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

    addButtonEventListeners(this.prevBtn, () => {
      try {
        this.emblaApi?.scrollPrev()
      } catch (error) {
        handleScriptError(error, { scriptName: SCRIPT_NAME, operation: 'scrollPrev' })
      }
    }, this)

    addButtonEventListeners(this.nextBtn, () => {
      try {
        this.emblaApi?.scrollNext()
      } catch (error) {
        handleScriptError(error, { scriptName: SCRIPT_NAME, operation: 'scrollNext' })
      }
    }, this)

    this.emblaApi.on('select', updateButtonStates)
    this.emblaApi.on('reInit', updateButtonStates)
    updateButtonStates()
  }

  private setupDotsNavigation(): void {
    if (!this.emblaApi || !this.dotsContainer) return

    let dots: HTMLButtonElement[] = []

    const rebuildDots = () => {
      if (!this.emblaApi || !this.dotsContainer) return

      const dotsContainer = this.dotsContainer
      dotsContainer.innerHTML = ''
      dots = []

      this.emblaApi.scrollSnapList().forEach((_, index) => {
        const dot = (this.ownerDocument ?? document).createElement('button')
        dot.type = 'button'
        dot.dataset['index'] = String(index)
        dot.className = 'embla__dot w-2 h-2 rounded-full bg-[color:var(--color-text-offset)] transition-all duration-300 hover:bg-[color:var(--color-primary)]'
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`)

        addButtonEventListeners(dot, () => {
          try {
            this.emblaApi?.scrollTo(index)
          } catch (error) {
            handleScriptError(error, { scriptName: SCRIPT_NAME, operation: 'scrollToDot' })
          }
        }, this)

        dotsContainer.appendChild(dot)
        dots.push(dot)
      })
    }

    const updateDots = () => {
      if (!this.emblaApi) return
      const selectedIndex = this.emblaApi.selectedScrollSnap()

      dots.forEach((dot, index) => {
        if (index === selectedIndex) {
          dot.classList.add('is-active', 'bg-[color:var(--color-primary)]', 'w-8')
          dot.classList.remove('bg-[color:var(--color-text-offset)]', 'w-2')
          dot.setAttribute('aria-current', 'true')
        } else {
          dot.classList.remove('is-active', 'bg-[color:var(--color-primary)]', 'w-8')
          dot.classList.add('bg-[color:var(--color-text-offset)]', 'w-2')
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
      this.autoplayPlugin?.stop()
      this.setAutoplayState('paused')
    } catch (error) {
      handleScriptError(error, { scriptName: SCRIPT_NAME, operation: 'pause' })
    }
  }

  resume(): void {
    try {
      this.autoplayPlugin?.play()
      this.setAutoplayState('playing')
    } catch (error) {
      handleScriptError(error, { scriptName: SCRIPT_NAME, operation: 'resume' })
    }
  }

  private setAutoplayState(state: 'playing' | 'paused'): void {
    this.setAttribute('data-carousel-autoplay', state)
  }

  private static registerInstance(instance: CarouselElement): void {
    CarouselElement.instances.add(instance)
    CarouselElement.ensureVisibilityHandler()
  }

  private static unregisterInstance(instance: CarouselElement): void {
    CarouselElement.instances.delete(instance)
    if (CarouselElement.instances.size === 0) {
      CarouselElement.cleanupVisibilityHandler()
    }
  }

  private static ensureVisibilityHandler(): void {
    if (typeof document === 'undefined') return
    if (CarouselElement.visibilityHandler) return

    CarouselElement.visibilityHandler = () => {
      if (document.hidden) {
        CarouselElement.instances.forEach(instance => instance.pause())
      } else {
        CarouselElement.instances.forEach(instance => instance.resume())
      }
    }

    document.addEventListener('visibilitychange', CarouselElement.visibilityHandler)
  }

  private static cleanupVisibilityHandler(): void {
    if (typeof document === 'undefined') return
    if (!CarouselElement.visibilityHandler) return

    document.removeEventListener('visibilitychange', CarouselElement.visibilityHandler)
    CarouselElement.visibilityHandler = undefined
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'carousel-slider': CarouselElement
  }
}

if (typeof window !== 'undefined' && !customElements.get('carousel-slider')) {
  customElements.define('carousel-slider', CarouselElement)
}
