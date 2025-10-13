/**
 * Testimonials Carousel Setup
 * Initializes Embla Carousel for testimonials display
 * Based on the generic Carousel component but customized for testimonials
 */

import EmblaCarousel, { type EmblaOptionsType } from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'

/**
 * Setup the testimonials carousel with Embla Carousel
 * Uses autoplay plugin for automatic sliding
 */
export const setupTestimonialsCarousel = (): void => {
  const emblaNode = document.querySelector<HTMLElement>('.testimonials-embla')

  if (!emblaNode) {
    console.warn('Testimonials carousel container not found')
    return
  }

  const viewportNode = emblaNode.querySelector<HTMLElement>('.embla__viewport')

  if (!viewportNode) {
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
  const emblaApi = EmblaCarousel(viewportNode, options, [
    Autoplay(autoplayOptions),
  ])

  // Setup navigation buttons
  const prevBtn = emblaNode.querySelector<HTMLButtonElement>('.embla__button--prev')
  const nextBtn = emblaNode.querySelector<HTMLButtonElement>('.embla__button--next')

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      emblaApi.scrollPrev()
    })

    nextBtn.addEventListener('click', () => {
      emblaApi.scrollNext()
    })

    // Update button states
    const updateButtonStates = () => {
      if (emblaApi.canScrollPrev()) {
        prevBtn.removeAttribute('disabled')
        prevBtn.classList.remove('opacity-30', 'cursor-not-allowed')
      } else {
        prevBtn.setAttribute('disabled', 'true')
        prevBtn.classList.add('opacity-30', 'cursor-not-allowed')
      }

      if (emblaApi.canScrollNext()) {
        nextBtn.removeAttribute('disabled')
        nextBtn.classList.remove('opacity-30', 'cursor-not-allowed')
      } else {
        nextBtn.setAttribute('disabled', 'true')
        nextBtn.classList.add('opacity-30', 'cursor-not-allowed')
      }
    }

    emblaApi.on('select', updateButtonStates)
    emblaApi.on('reInit', updateButtonStates)
    updateButtonStates()
  }

  // Setup dots navigation
  const dotsContainer = emblaNode.querySelector<HTMLElement>('.embla__dots')

  if (dotsContainer) {
    const scrollSnaps = emblaApi.scrollSnapList()

    // Create dot buttons
    scrollSnaps.forEach((_, index) => {
      const dot = document.createElement('button')
      dot.type = 'button'
      dot.className = 'embla__dot w-3 h-3 rounded-full bg-[color:var(--color-text-offset)] transition-all duration-300 hover:bg-[color:var(--color-primary)]'
      dot.setAttribute('aria-label', `Go to testimonial ${index + 1}`)

      dot.addEventListener('click', () => {
        emblaApi.scrollTo(index)
      })

      dotsContainer.appendChild(dot)
    })

    const dots = Array.from(dotsContainer.querySelectorAll<HTMLElement>('.embla__dot'))

    const updateDots = () => {
      const selectedIndex = emblaApi.selectedScrollSnap()
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

    emblaApi.on('select', updateDots)
    emblaApi.on('reInit', updateDots)
    updateDots()
  }

  // Log initialization
  console.log('Testimonials carousel initialized with autoplay')
}