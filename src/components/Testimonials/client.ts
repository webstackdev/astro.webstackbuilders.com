/**
 * Testimonials Carousel Setup
 * Initializes Embla Carousel for testimonials display
 * Uses LoadableScript pattern for proper initialization timing
 */

import EmblaCarousel, { type EmblaOptionsType, type EmblaCarouselType } from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import { LoadableScript, type TriggerEvent } from '../Scripts/loader/@types/loader'

/**
 * Testimonials carousel using LoadableScript pattern with instance-specific approach
 * Uses Embla Carousel with autoplay for testimonials display
 */
export class TestimonialsCarousel extends LoadableScript {
  static override scriptName = 'TestimonialsCarousel'
  static override eventType: TriggerEvent = 'delayed'

  private emblaNode: HTMLElement | null = null
  private viewportNode: HTMLElement | null = null
  private emblaApi: EmblaCarouselType | null = null

  constructor() {
    super()
    this.findElements()
  }

  /**
   * Find and cache DOM elements
   */
  private findElements(): void {
    this.emblaNode = document.querySelector<HTMLElement>('.testimonials-embla')
    if (this.emblaNode) {
      this.viewportNode = this.emblaNode.querySelector<HTMLElement>('.embla__viewport')
    }
  }

  /**
   * Initialize the Embla Carousel
   */
  private initializeCarousel(): void {
    if (!this.emblaNode) {
      console.warn('Testimonials carousel container not found')
      return
    }

    if (!this.viewportNode) {
      console.warn('Testimonials carousel viewport not found')
      return
    }

    // Embla carousel options optimized for testimonials
    const options: EmblaOptionsType = {
      loop: true,
      align: 'center',
      skipSnaps: false,
      dragFree: false,
    }

    // Autoplay plugin configuration - slower for testimonials
    const autoplayOptions = {
      delay: 6000, // Longer delay for reading testimonials
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    }

    // Initialize Embla Carousel with Autoplay plugin
    this.emblaApi = EmblaCarousel(this.viewportNode, options, [Autoplay(autoplayOptions)])

    this.setupNavigationButtons()
    this.setupDotsNavigation()

    // Log initialization
    console.log('Testimonials carousel initialized with autoplay')
  }

  /**
   * Setup navigation buttons
   */
  private setupNavigationButtons(): void {
    if (!this.emblaNode || !this.emblaApi) return

    const prevBtn = this.emblaNode.querySelector<HTMLButtonElement>('.embla__button--prev')
    const nextBtn = this.emblaNode.querySelector<HTMLButtonElement>('.embla__button--next')

    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        this.emblaApi?.scrollPrev()
      })

      nextBtn.addEventListener('click', () => {
        this.emblaApi?.scrollNext()
      })

      // Update button states
      const updateButtonStates = () => {
        if (!this.emblaApi) return

        if (this.emblaApi.canScrollPrev()) {
          prevBtn.removeAttribute('disabled')
          prevBtn.classList.remove('opacity-30', 'cursor-not-allowed')
        } else {
          prevBtn.setAttribute('disabled', 'true')
          prevBtn.classList.add('opacity-30', 'cursor-not-allowed')
        }

        if (this.emblaApi.canScrollNext()) {
          nextBtn.removeAttribute('disabled')
          nextBtn.classList.remove('opacity-30', 'cursor-not-allowed')
        } else {
          nextBtn.setAttribute('disabled', 'true')
          nextBtn.classList.add('opacity-30', 'cursor-not-allowed')
        }
      }

      this.emblaApi.on('select', updateButtonStates)
      this.emblaApi.on('reInit', updateButtonStates)
      updateButtonStates()
    }
  }

  /**
   * Setup dots navigation
   */
  private setupDotsNavigation(): void {
    if (!this.emblaNode || !this.emblaApi) return

    const dotsContainer = this.emblaNode.querySelector<HTMLElement>('.embla__dots')

    if (dotsContainer) {
      const scrollSnaps = this.emblaApi.scrollSnapList()

      // Create dot buttons
      scrollSnaps.forEach((_: unknown, index: number) => {
        const dot = document.createElement('button')
        dot.type = 'button'
        dot.className =
          'embla__dot w-3 h-3 rounded-full bg-[color:var(--color-text-offset)] transition-all duration-300 hover:bg-[color:var(--color-primary)]'
        dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`)

        dot.addEventListener('click', () => {
          this.emblaApi?.scrollTo(index)
        })

        dotsContainer.appendChild(dot)
      })

      const dots = Array.from(dotsContainer.querySelectorAll<HTMLElement>('.embla__dot'))

      const updateDots = () => {
        if (!this.emblaApi) return

        const selectedIndex = this.emblaApi.selectedScrollSnap()
        dots.forEach((dot, index) => {
          if (index === selectedIndex) {
            dot.classList.add('bg-[color:var(--color-primary)]', 'w-6')
            dot.classList.remove('bg-[color:var(--color-text-offset)]', 'w-3')
          } else {
            dot.classList.remove('bg-[color:var(--color-primary)]', 'w-6')
            dot.classList.add('bg-[color:var(--color-text-offset)]', 'w-3')
          }
        })
      }

      this.emblaApi.on('select', updateDots)
      this.emblaApi.on('reInit', updateDots)
      updateDots()
    }
  }

  /**
   * LoadableScript static methods
   */
  static override init(): void {
    const testimonialsCarousel = new TestimonialsCarousel()
    testimonialsCarousel.initializeCarousel()
  }

  static override pause(): void {
    // Carousel doesn't need pause functionality during visibility changes
  }

  static override resume(): void {
    // Carousel doesn't need resume functionality during visibility changes
  }

  static override reset(): void {
    // Clean up any global state if needed for View Transitions
    // Embla API will be cleaned up automatically when the DOM changes
  }
}
