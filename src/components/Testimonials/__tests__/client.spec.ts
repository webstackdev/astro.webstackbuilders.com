/**
 * Unit tests for TestimonialsCarousel LoadableScript class
 * Tests the carousel functionality and LoadableScript integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TestimonialsCarousel } from '../client'
import {
  setupTestimonialsCarouselDOM,
  cleanupTestimonialsCarouselDOM,
  getDOMElements,
  userInteractions,
} from '../__fixtures__/domHelpers'
import { mockTestimonials } from '../__fixtures__/mockData'

// Mock embla-carousel
const mockScrollPrev = vi.fn()
const mockScrollNext = vi.fn()
const mockScrollTo = vi.fn()
const mockCanScrollPrev = vi.fn(() => true)
const mockCanScrollNext = vi.fn(() => true)
const mockSelectedScrollSnap = vi.fn(() => 0)
const mockScrollSnapList = vi.fn(() => [0, 1, 2])
const mockOn = vi.fn()

const mockEmblaApi = {
  scrollPrev: mockScrollPrev,
  scrollNext: mockScrollNext,
  scrollTo: mockScrollTo,
  canScrollPrev: mockCanScrollPrev,
  canScrollNext: mockCanScrollNext,
  selectedScrollSnap: mockSelectedScrollSnap,
  scrollSnapList: mockScrollSnapList,
  on: mockOn,
}

vi.mock('embla-carousel', () => ({
  default: vi.fn(() => mockEmblaApi),
}))

// Mock embla-carousel-autoplay
vi.mock('embla-carousel-autoplay', () => ({
  default: vi.fn(() => ({})),
}))

describe('TestimonialsCarousel LoadableScript', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    // Setup fresh DOM for each test
    setupTestimonialsCarouselDOM()
  })

  afterEach(() => {
    // Clean up DOM after each test
    cleanupTestimonialsCarouselDOM()
  })

  describe('LoadableScript implementation', () => {
    it('should have correct static properties', () => {
      expect(TestimonialsCarousel.scriptName).toBe('TestimonialsCarousel')
      expect(TestimonialsCarousel.eventType).toBe('delayed')
    })

    it('should implement all LoadableScript methods', () => {
      expect(typeof TestimonialsCarousel.init).toBe('function')
      expect(typeof TestimonialsCarousel.pause).toBe('function')
      expect(typeof TestimonialsCarousel.resume).toBe('function')
      expect(typeof TestimonialsCarousel.reset).toBe('function')
    })

    it('should initialize without errors', () => {
      expect(() => TestimonialsCarousel.init()).not.toThrow()
    })
  })

  describe('Carousel initialization', () => {
    it('should find testimonials carousel container and viewport', () => {
      TestimonialsCarousel.init()

      const elements = getDOMElements()
      expect(elements.container).toBeTruthy()
      expect(elements.viewport).toBeTruthy()
    })

    it('should warn if carousel container is not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Remove the carousel container
      document.body.innerHTML = '<div>No carousel here</div>'

      TestimonialsCarousel.init()

      expect(consoleSpy).toHaveBeenCalledWith('Testimonials carousel container not found')

      consoleSpy.mockRestore()
    })

    it('should warn if viewport is not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Set up container without viewport
      document.body.innerHTML = '<div class="testimonials-embla">No viewport</div>'

      TestimonialsCarousel.init()

      expect(consoleSpy).toHaveBeenCalledWith('Testimonials carousel viewport not found')

      consoleSpy.mockRestore()
    })

    it('should initialize Embla Carousel with correct options', async () => {
      const EmblaCarousel = (await import('embla-carousel')).default

      TestimonialsCarousel.init()

      expect(EmblaCarousel).toHaveBeenCalledWith(
        expect.any(Element), // viewport element
        {
          loop: true,
          align: 'center',
          skipSnaps: false,
          dragFree: false,
        },
        expect.arrayContaining([expect.any(Object)]) // autoplay plugin
      )
    })

    it('should initialize autoplay plugin with testimonials-specific settings', async () => {
      const Autoplay = (await import('embla-carousel-autoplay')).default

      TestimonialsCarousel.init()

      expect(Autoplay).toHaveBeenCalledWith({
        delay: 6000, // Longer delay for reading testimonials
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      })
    })

    it('should log successful initialization', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      TestimonialsCarousel.init()

      expect(consoleSpy).toHaveBeenCalledWith('Testimonials carousel initialized with autoplay')

      consoleSpy.mockRestore()
    })
  })

  describe('Navigation Buttons', () => {
    it('should setup prev/next button event listeners', () => {
      TestimonialsCarousel.init()

      // Click prev button
      userInteractions.clickPrevButton()
      expect(mockScrollPrev).toHaveBeenCalledTimes(1)

      // Click next button
      userInteractions.clickNextButton()
      expect(mockScrollNext).toHaveBeenCalledTimes(1)
    })

    it('should update button states when carousel can scroll', () => {
      mockCanScrollPrev.mockReturnValue(true)
      mockCanScrollNext.mockReturnValue(true)

      TestimonialsCarousel.init()

      const elements = getDOMElements()

      // Simulate 'select' event callback
      const selectCallback = mockOn.mock.calls.find(call => call[0] === 'select')?.[1]
      if (selectCallback) {
        selectCallback()
      }

      expect(elements.prevButton?.hasAttribute('disabled')).toBe(false)
      expect(elements.nextButton?.hasAttribute('disabled')).toBe(false)
      expect(elements.prevButton?.classList.contains('opacity-30')).toBe(false)
      expect(elements.nextButton?.classList.contains('opacity-30')).toBe(false)
    })

    it('should disable prev button when cannot scroll prev', () => {
      mockCanScrollPrev.mockReturnValue(false)
      mockCanScrollNext.mockReturnValue(true)

      TestimonialsCarousel.init()

      const elements = getDOMElements()

      // Simulate 'select' event callback
      const selectCallback = mockOn.mock.calls.find(call => call[0] === 'select')?.[1]
      if (selectCallback) {
        selectCallback()
      }

      expect(elements.prevButton?.hasAttribute('disabled')).toBe(true)
      expect(elements.prevButton?.classList.contains('opacity-30')).toBe(true)
      expect(elements.prevButton?.classList.contains('cursor-not-allowed')).toBe(true)
    })

    it('should disable next button when cannot scroll next', () => {
      mockCanScrollPrev.mockReturnValue(true)
      mockCanScrollNext.mockReturnValue(false)

      TestimonialsCarousel.init()

      const elements = getDOMElements()

      // Simulate 'select' event callback
      const selectCallback = mockOn.mock.calls.find(call => call[0] === 'select')?.[1]
      if (selectCallback) {
        selectCallback()
      }

      expect(elements.nextButton?.hasAttribute('disabled')).toBe(true)
      expect(elements.nextButton?.classList.contains('opacity-30')).toBe(true)
      expect(elements.nextButton?.classList.contains('cursor-not-allowed')).toBe(true)
    })

    it('should setup event listeners for reInit event', () => {
      TestimonialsCarousel.init()

      // Verify that 'reInit' event listener was added
      expect(mockOn).toHaveBeenCalledWith('reInit', expect.any(Function))
    })
  })

  describe('Dots Navigation', () => {
    it('should create dot buttons based on scroll snaps', () => {
      TestimonialsCarousel.init()

      const elements = getDOMElements()
      const dots = elements.dotsContainer?.querySelectorAll('.embla__dot')

      expect(dots?.length).toBe(3) // Based on mockScrollSnapList returning [0, 1, 2]
    })

    it('should create dots with proper accessibility attributes', () => {
      TestimonialsCarousel.init()

      const elements = getDOMElements()
      const dots = elements.dotsContainer?.querySelectorAll('.embla__dot')

      dots?.forEach((dot, index) => {
        expect(dot.getAttribute('type')).toBe('button')
        expect(dot.getAttribute('aria-label')).toBe(`Go to testimonial ${index + 1}`)
      })
    })

    it('should handle dot click events', () => {
      TestimonialsCarousel.init()

      // Click on the second dot (index 1)
      userInteractions.clickDot(1)

      expect(mockScrollTo).toHaveBeenCalledWith(1)
    })

    it('should update dot states on select event', () => {
      mockSelectedScrollSnap.mockReturnValue(1) // Second dot is active

      TestimonialsCarousel.init()

      const elements = getDOMElements()

      // Simulate 'select' event callback
      const selectCallback = mockOn.mock.calls.find(call => call[0] === 'select')?.[1]
      if (selectCallback) {
        selectCallback()
      }

      const dots = elements.dotsContainer?.querySelectorAll('.embla__dot')

      // First dot should not be active
      expect(dots).toBeDefined()
      expect(dots![0]?.classList.contains('bg-[color:var(--color-primary)]')).toBe(false)
      expect(dots![0]?.classList.contains('w-6')).toBe(false)

      // Second dot should be active
      expect(dots![1]?.classList.contains('bg-[color:var(--color-primary)]')).toBe(true)
      expect(dots![1]?.classList.contains('w-6')).toBe(true)
    })

    it('should setup event listeners for dots updates', () => {
      TestimonialsCarousel.init()

      // Verify that both 'select' and 'reInit' event listeners were added for dots
      expect(mockOn).toHaveBeenCalledWith('select', expect.any(Function))
      expect(mockOn).toHaveBeenCalledWith('reInit', expect.any(Function))
    })
  })

  describe('Error Handling', () => {
    it('should handle missing navigation buttons gracefully', () => {
      // Remove navigation buttons from DOM
      const elements = getDOMElements()
      elements.prevButton?.remove()
      elements.nextButton?.remove()

      // Should not throw error
      expect(() => TestimonialsCarousel.init()).not.toThrow()
    })

    it('should handle missing dots container gracefully', () => {
      // Remove dots container from DOM
      const elements = getDOMElements()
      elements.dotsContainer?.remove()

      // Should not throw error
      expect(() => TestimonialsCarousel.init()).not.toThrow()
    })

    it('should handle case when carousel has no slides', () => {
      // Setup empty carousel
      document.body.innerHTML = `
        <section class="testimonials-embla">
          <div class="embla__viewport">
            <div class="embla__container"></div>
          </div>
          <div class="embla__dots"></div>
        </section>
      `

      mockScrollSnapList.mockReturnValue([]) // No slides

      // Should not throw error
      expect(() => TestimonialsCarousel.init()).not.toThrow()

      // Should not create any dots
      const dotsContainer = document.querySelector('.embla__dots')
      const dots = dotsContainer?.querySelectorAll('.embla__dot')
      expect(dots?.length).toBe(0)
    })
  })

  describe('DOM Integration', () => {
    it('should work with the expected DOM structure', () => {
      // Verify DOM structure matches what the function expects
      const container = document.querySelector('.testimonials-embla')
      const viewport = container?.querySelector('.embla__viewport')
      const slides = document.querySelectorAll('.embla__slide')

      expect(container).toBeTruthy()
      expect(viewport).toBeTruthy()
      expect(slides.length).toBe(mockTestimonials.length)

      // Should initialize without errors
      expect(() => TestimonialsCarousel.init()).not.toThrow()
    })

    it('should preserve existing CSS classes on elements', () => {
      TestimonialsCarousel.init()

      const elements = getDOMElements()

      // Navigation buttons should maintain their original classes
      expect(elements.prevButton?.classList.contains('embla__button--prev')).toBe(true)
      expect(elements.nextButton?.classList.contains('embla__button--next')).toBe(true)

      // Dots container should maintain its class
      expect(elements.dotsContainer?.classList.contains('embla__dots')).toBe(true)
    })
  })

  describe('Instance methods', () => {
    it('should create instance with proper initialization', () => {
      const instance = new TestimonialsCarousel()
      expect(instance).toBeInstanceOf(TestimonialsCarousel)
    })

    it('should handle initialization when DOM elements are not found', () => {
      // Clear DOM
      document.body.innerHTML = ''

      const instance = new TestimonialsCarousel()
      expect(instance).toBeInstanceOf(TestimonialsCarousel)
    })
  })
})
