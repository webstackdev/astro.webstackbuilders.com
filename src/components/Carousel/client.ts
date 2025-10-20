import { LoadableScript, type TriggerEvent } from '../Scripts/loader/@types/loader'
import EmblaCarousel, { type EmblaOptionsType, type EmblaCarouselType } from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import { ClientScriptError } from '@components/Scripts/errors/ClientScriptError'
import { handleScriptError, addScriptBreadcrumb } from '@components/Scripts/errors'

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
    const context = { scriptName: CarouselManager.scriptName, operation: 'init' }
    addScriptBreadcrumb(context)

    try {
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
    } catch (error) {
      handleScriptError(error, context)
    }
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
    const context = { scriptName: CarouselManager.scriptName, operation: 'discoverCarousels' }
    addScriptBreadcrumb(context)

    try {
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
          // One carousel failing shouldn't break all carousels
          handleScriptError(error, { scriptName: CarouselManager.scriptName, operation: 'initCarousel' })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private setupGlobalListeners(): void {
    const context = { scriptName: CarouselManager.scriptName, operation: 'setupGlobalListeners' }
    addScriptBreadcrumb(context)

    try {
      // Handle visibility changes for all carousels
      document.addEventListener('visibilitychange', () => {
        try {
          if (document.hidden) {
            this.pauseAll()
          } else {
            this.resumeAll()
          }
        } catch (error) {
          handleScriptError(error, { scriptName: CarouselManager.scriptName, operation: 'visibilityChange' })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private pauseAll(): void {
    const context = { scriptName: CarouselManager.scriptName, operation: 'pauseAll' }
    addScriptBreadcrumb(context)

    try {
      this.carousels.forEach(carousel => {
        try {
          carousel.pause()
        } catch (error) {
          handleScriptError(error, { scriptName: CarouselManager.scriptName, operation: 'pauseCarousel' })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private resumeAll(): void {
    const context = { scriptName: CarouselManager.scriptName, operation: 'resumeAll' }
    addScriptBreadcrumb(context)

    try {
      this.carousels.forEach(carousel => {
        try {
          carousel.resume()
        } catch (error) {
          handleScriptError(error, { scriptName: CarouselManager.scriptName, operation: 'resumeCarousel' })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  // Method to clean up carousels that are no longer in DOM (for SPA navigation)
  private cleanup(): void {
    const context = { scriptName: CarouselManager.scriptName, operation: 'cleanup' }
    addScriptBreadcrumb(context)

    try {
      const toRemove: HTMLElement[] = []

      this.carousels.forEach((carousel, element) => {
        try {
          if (!document.contains(element)) {
            carousel.destroy()
            toRemove.push(element)
          }
        } catch (error) {
          handleScriptError(error, { scriptName: CarouselManager.scriptName, operation: 'cleanupCarousel' })
          toRemove.push(element)
        }
      })

      toRemove.forEach(element => {
        try {
          this.carousels.delete(element)
        } catch (error) {
          handleScriptError(error, { scriptName: CarouselManager.scriptName, operation: 'deleteCarousel' })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
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

  constructor(container: HTMLElement, _instanceId: number) {
    this.prevBtn = container.querySelector('.embla__button--prev')
    this.nextBtn = container.querySelector('.embla__button--next')
    this.viewport = container.querySelector('.embla__viewport')
    this.dotsContainer = container.querySelector('.embla__dots')
  }

  initialize(): void {
    const context = { scriptName: 'CarouselInstance', operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      if (!this.viewport) {
        throw new ClientScriptError('CarouselInstance: Viewport element not found. Carousel cannot function without viewport.')
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
    } catch (error) {
      if (error instanceof ClientScriptError) {
        throw error
      }
      handleScriptError(error, context)
    }
  }

  private setupNavigationButtons(): void {
    const context = { scriptName: 'CarouselInstance', operation: 'setupNavigationButtons' }
    addScriptBreadcrumb(context)

    try {
      if (!this.emblaApi || !this.prevBtn || !this.nextBtn) return

      this.prevBtn.addEventListener('click', () => {
        try {
          this.emblaApi!.scrollPrev()
        } catch (error) {
          handleScriptError(error, { scriptName: 'CarouselInstance', operation: 'scrollPrev' })
        }
      })

      this.nextBtn.addEventListener('click', () => {
        try {
          this.emblaApi!.scrollNext()
        } catch (error) {
          handleScriptError(error, { scriptName: 'CarouselInstance', operation: 'scrollNext' })
        }
      })

      // Update button states
      const updateButtonStates = () => {
        try {
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
        } catch (error) {
          handleScriptError(error, { scriptName: 'CarouselInstance', operation: 'updateButtonStates' })
        }
      }

      this.emblaApi.on('select', updateButtonStates)
      this.emblaApi.on('reInit', updateButtonStates)
      updateButtonStates()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private setupDotsNavigation(): void {
    const context = { scriptName: 'CarouselInstance', operation: 'setupDotsNavigation' }
    addScriptBreadcrumb(context)

    try {
      if (!this.emblaApi || !this.dotsContainer) return

      const scrollSnaps = this.emblaApi.scrollSnapList()

      // Create dot buttons
      scrollSnaps.forEach((_, index) => {
        try {
          const dot = document.createElement('button')
          dot.type = 'button'
          dot.className =
            'embla__dot w-2 h-2 rounded-full bg-[color:var(--color-text-offset)] transition-all duration-300 hover:bg-[color:var(--color-primary)]'
          dot.setAttribute('aria-label', `Go to slide ${index + 1}`)

          dot.addEventListener('click', () => {
            try {
              this.emblaApi!.scrollTo(index)
            } catch (error) {
              handleScriptError(error, { scriptName: 'CarouselInstance', operation: 'scrollToDot' })
            }
          })

          this.dotsContainer!.appendChild(dot)
        } catch (error) {
          // One dot failing shouldn't break all dots
          handleScriptError(error, { scriptName: 'CarouselInstance', operation: 'createDot' })
        }
      })

      const dots = Array.from(this.dotsContainer.querySelectorAll<HTMLElement>('.embla__dot'))

      const updateDots = () => {
        try {
          const selectedIndex = this.emblaApi!.selectedScrollSnap()
          dots.forEach((dot, index) => {
            try {
              if (index === selectedIndex) {
                dot.classList.add('bg-[color:var(--color-primary)]', 'w-8')
                dot.classList.remove('bg-[color:var(--color-text-offset)]', 'w-2')
              } else {
                dot.classList.remove('bg-[color:var(--color-primary)]', 'w-8')
                dot.classList.add('bg-[color:var(--color-text-offset)]', 'w-2')
              }
            } catch (error) {
              handleScriptError(error, { scriptName: 'CarouselInstance', operation: 'updateDot' })
            }
          })
        } catch (error) {
          handleScriptError(error, { scriptName: 'CarouselInstance', operation: 'updateDots' })
        }
      }

      this.emblaApi.on('select', updateDots)
      this.emblaApi.on('reInit', updateDots)
      updateDots()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  pause(): void {
    const context = { scriptName: 'CarouselInstance', operation: 'pause' }
    addScriptBreadcrumb(context)

    try {
      if (this.autoplayPlugin) {
        this.autoplayPlugin.stop()
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  resume(): void {
    const context = { scriptName: 'CarouselInstance', operation: 'resume' }
    addScriptBreadcrumb(context)

    try {
      if (this.autoplayPlugin) {
        this.autoplayPlugin.play()
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  destroy(): void {
    const context = { scriptName: 'CarouselInstance', operation: 'destroy' }
    addScriptBreadcrumb(context)

    try {
      if (this.emblaApi) {
        this.emblaApi.destroy()
      }
      this.emblaApi = null
      this.autoplayPlugin = null
    } catch (error) {
      handleScriptError(error, context)
    }
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
  ;(window as any).__CarouselManager = CarouselManager
}
