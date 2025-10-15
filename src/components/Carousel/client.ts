import { LoadableScript, type TriggerEvent } from '../Scripts/loader/@types/loader'
import EmblaCarousel, { type EmblaOptionsType, type EmblaCarouselType } from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'

/**
 * Auto-discovery carousel implementation using singleton pattern
 * Can be registered directly without instantiation: registerScript(CarouselManager)
 */
export class CarouselManager extends LoadableScript {
  private static instance: CarouselManager | null = null
  private carousels: Map<HTMLElement, CarouselInstance> = new Map()
  private initialized = false

  static override scriptName = 'CarouselManager'
  static override eventType: TriggerEvent = 'astro:page-load'

  static override init(): void {
    const instance = CarouselManager.getInstance()

    if (instance.initialized) {
      // Already initialized for this page, just discover new carousels
      instance.discoverNewCarousels()
      return
    }

    console.log('Initializing CarouselManager...')
    instance.discoverNewCarousels()
    instance.setupGlobalListeners()
    instance.initialized = true
  }

  static override pause(): void {
    CarouselManager.getInstance().pauseAll()
  }

  static override resume(): void {
    CarouselManager.getInstance().resumeAll()
  }

  // Singleton pattern
  private static getInstance(): CarouselManager {
    if (!CarouselManager.instance) {
      CarouselManager.instance = new CarouselManager()
    }
    return CarouselManager.instance
  }

  private constructor() {
    // Private constructor for singleton
    super()
  }

  private discoverNewCarousels(): void {
    const carouselElements = document.querySelectorAll('.embla:not([data-carousel-managed])')

    carouselElements.forEach((element, index) => {
      try {
        const htmlElement = element as HTMLElement
        const carousel = new CarouselInstance(htmlElement, this.carousels.size + index)
        carousel.initialize()

        this.carousels.set(htmlElement, carousel)
        htmlElement.setAttribute('data-carousel-managed', 'true')

        console.log(`Carousel ${this.carousels.size} initialized with autoplay`)
      } catch (error) {
        console.error(`Failed to initialize carousel:`, error)
      }
    })
  }

  private setupGlobalListeners(): void {
    // Handle visibility changes for all carousels
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAll()
      } else {
        this.resumeAll()
      }
    })
  }

  private pauseAll(): void {
    this.carousels.forEach(carousel => carousel.pause())
  }

  private resumeAll(): void {
    this.carousels.forEach(carousel => carousel.resume())
  }

  // Method to clean up carousels that are no longer in DOM (for SPA navigation)
  private cleanup(): void {
    const toRemove: HTMLElement[] = []

    this.carousels.forEach((carousel, element) => {
      if (!document.contains(element)) {
        carousel.destroy()
        toRemove.push(element)
      }
    })

    toRemove.forEach(element => {
      this.carousels.delete(element)
    })
  }

  // Reset for new page navigation
  static override reset(): void {
    const instance = CarouselManager.instance
    if (instance) {
      instance.cleanup()
      instance.initialized = false
    }
  }
}

/**
 * Individual carousel instance
 */
class CarouselInstance {
  private emblaApi: EmblaCarouselType | null = null
  private autoplayPlugin: ReturnType<typeof Autoplay> | null = null
  private prevBtn: HTMLButtonElement | null
  private nextBtn: HTMLButtonElement | null
  private viewport: HTMLElement | null
  private dotsContainer: HTMLElement | null

  constructor(
    container: HTMLElement,
    _instanceId: number
  ) {
    this.prevBtn = container.querySelector('.embla__button--prev')
    this.nextBtn = container.querySelector('.embla__button--next')
    this.viewport = container.querySelector('.embla__viewport')
    this.dotsContainer = container.querySelector('.embla__dots')
  }

  initialize(): void {
    if (!this.viewport) {
      console.warn('Carousel viewport not found')
      return
    }

    // Embla carousel options
    const options: EmblaOptionsType = {
      loop: true,
      align: 'start',
      skipSnaps: false,
      dragFree: false,
    }

    // Autoplay plugin configuration
    const autoplayOptions = {
      delay: 4000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    }

    this.autoplayPlugin = Autoplay(autoplayOptions)

    // Initialize Embla Carousel with Autoplay plugin
    this.emblaApi = EmblaCarousel(this.viewport, options, [this.autoplayPlugin])

    this.setupNavigationButtons()
    this.setupDotsNavigation()
  }

  private setupNavigationButtons(): void {
    if (!this.emblaApi || !this.prevBtn || !this.nextBtn) return

    this.prevBtn.addEventListener('click', () => {
      this.emblaApi!.scrollPrev()
    })

    this.nextBtn.addEventListener('click', () => {
      this.emblaApi!.scrollNext()
    })

    // Update button states
    const updateButtonStates = () => {
      if (this.emblaApi!.canScrollPrev()) {
        this.prevBtn!.removeAttribute('disabled')
        this.prevBtn!.classList.remove('opacity-30', 'cursor-not-allowed')
      } else {
        this.prevBtn!.setAttribute('disabled', 'true')
        this.prevBtn!.classList.add('opacity-30', 'cursor-not-allowed')
      }

      if (this.emblaApi!.canScrollNext()) {
        this.nextBtn!.removeAttribute('disabled')
        this.nextBtn!.classList.remove('opacity-30', 'cursor-not-allowed')
      } else {
        this.nextBtn!.setAttribute('disabled', 'true')
        this.nextBtn!.classList.add('opacity-30', 'cursor-not-allowed')
      }
    }

    this.emblaApi.on('select', updateButtonStates)
    this.emblaApi.on('reInit', updateButtonStates)
    updateButtonStates()
  }

  private setupDotsNavigation(): void {
    if (!this.emblaApi || !this.dotsContainer) return

    const scrollSnaps = this.emblaApi.scrollSnapList()

    // Create dot buttons
    scrollSnaps.forEach((_, index) => {
      const dot = document.createElement('button')
      dot.type = 'button'
      dot.className = 'embla__dot w-2 h-2 rounded-full bg-[color:var(--color-text-offset)] transition-all duration-300 hover:bg-[color:var(--color-primary)]'
      dot.setAttribute('aria-label', `Go to slide ${index + 1}`)

      dot.addEventListener('click', () => {
        this.emblaApi!.scrollTo(index)
      })

      this.dotsContainer!.appendChild(dot)
    })

    const dots = Array.from(this.dotsContainer.querySelectorAll<HTMLElement>('.embla__dot'))

    const updateDots = () => {
      const selectedIndex = this.emblaApi!.selectedScrollSnap()
      dots.forEach((dot, index) => {
        if (index === selectedIndex) {
          dot.classList.add('bg-[color:var(--color-primary)]', 'w-8')
          dot.classList.remove('bg-[color:var(--color-text-offset)]', 'w-2')
        } else {
          dot.classList.remove('bg-[color:var(--color-primary)]', 'w-8')
          dot.classList.add('bg-[color:var(--color-text-offset)]', 'w-2')
        }
      })
    }

    this.emblaApi.on('select', updateDots)
    this.emblaApi.on('reInit', updateDots)
    updateDots()
  }

  pause(): void {
    if (this.autoplayPlugin) {
      this.autoplayPlugin.stop()
    }
  }

  resume(): void {
    if (this.autoplayPlugin) {
      this.autoplayPlugin.play()
    }
  }

  destroy(): void {
    if (this.emblaApi) {
      this.emblaApi.destroy()
    }
    this.emblaApi = null
    this.autoplayPlugin = null
  }
}

/**
 * For development/debugging:
 *
 * Inspect the singleton manager
 * console.log(window.__CarouselManager)
 *
 * Pause all carousels
 * window.__CarouselManager.pause()
 *
 * Resume all carousels
 * window.__CarouselManager.resume()
 *
 * Reset manager state (for SPA navigation)
 * window.__CarouselManager.reset()
 */
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__CarouselManager = CarouselManager
}


