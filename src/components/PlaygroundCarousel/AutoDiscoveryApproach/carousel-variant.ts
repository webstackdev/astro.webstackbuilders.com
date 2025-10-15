import type { LoadableScript, TriggerEvent } from '@components/Scripts/loader/@types/loader'

/**
 * Auto-discovery carousel implementation using singleton pattern
 * Can be registered directly without instantiation: registerScript(CarouselManager)
 */
export class CarouselManager implements LoadableScript {
  private static instance: CarouselManager | null = null
  private carousels: Map<HTMLElement, CarouselInstance> = new Map()
  private initialized = false

  // Static properties for LoadableScript interface
  static name = 'Carousel'
  static eventType: TriggerEvent = 'astro:page-load'

  // Static methods for LoadableScript interface

  static init(): void {
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

  static pause(): void {
    CarouselManager.getInstance().pauseAll()
  }

  static resume(): void {
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
  }

  private discoverNewCarousels(): void {
    const carouselElements = document.querySelectorAll('[data-carousel]:not([data-carousel-managed])')

    carouselElements.forEach((element, index) => {
      try {
        const htmlElement = element as HTMLElement
        const carousel = new CarouselInstance(htmlElement, this.carousels.size + index)
        carousel.bindEvents()

        this.carousels.set(htmlElement, carousel)
        htmlElement.setAttribute('data-carousel-managed', 'true')

        console.log(`Carousel ${this.carousels.size} initialized`)
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
  static reset(): void {
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
  private autoplayInterval?: number | undefined
  private currentSlide = 0
  private prevBtn: HTMLButtonElement | null
  private nextBtn: HTMLButtonElement | null
  private viewport: HTMLElement | null
  private slides: NodeListOf<Element>
  private autoplay: boolean

  constructor(
    container: HTMLElement,
    _instanceId: number
  ) {
    this.prevBtn = container.querySelector('[data-carousel-prev]')
    this.nextBtn = container.querySelector('[data-carousel-next]')
    this.viewport = container.querySelector('.carousel-viewport')
    this.slides = container.querySelectorAll('.carousel-slide')
    this.autoplay = container.dataset['autoplay'] === 'true'
  }

  bindEvents(): void {
    this.prevBtn?.addEventListener('click', () => this.previous())
    this.nextBtn?.addEventListener('click', () => this.next())

    if (this.autoplay) {
      this.startAutoplay()
    }
  }

  private startAutoplay(): void {
    this.autoplayInterval = window.setInterval(() => {
      this.next()
    }, 5000)
  }

  private previous(): void {
    this.currentSlide = this.currentSlide > 0 ? this.currentSlide - 1 : this.slides.length - 1
    this.updateSlidePosition()
  }

  private next(): void {
    this.currentSlide = this.currentSlide < this.slides.length - 1 ? this.currentSlide + 1 : 0
    this.updateSlidePosition()
  }

  private updateSlidePosition(): void {
    if (this.viewport) {
      const slideWidth = this.slides[0]?.getBoundingClientRect().width || 0
      const translateX = -this.currentSlide * slideWidth
      const container = this.viewport.querySelector('.carousel-container') as HTMLElement
      if (container) {
        container.style.transform = `translateX(${translateX}px)`
      }
    }
  }

  pause(): void {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval)
      this.autoplayInterval = undefined
    }
  }

  resume(): void {
    if (this.autoplay && !this.autoplayInterval) {
      this.startAutoplay()
    }
  }

  destroy(): void {
    this.pause()
    // Remove event listeners if needed
    this.prevBtn?.removeEventListener('click', () => this.previous())
    this.nextBtn?.removeEventListener('click', () => this.next())
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