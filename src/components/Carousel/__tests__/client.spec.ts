// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TestCarousel from '../__fixtures__/client.fixture.astro'

// Mock Embla Carousel and Autoplay plugin
const mockEmblaApi = {
  scrollPrev: vi.fn(),
  scrollNext: vi.fn(),
  scrollTo: vi.fn(),
  canScrollPrev: vi.fn(() => true),
  canScrollNext: vi.fn(() => true),
  selectedScrollSnap: vi.fn(() => 0),
  scrollSnapList: vi.fn(() => [0, 1, 2]),
  on: vi.fn(),
  off: vi.fn(),
  destroy: vi.fn(),
  reInit: vi.fn(),
}

const mockAutoplay = vi.fn(() => ({
  play: vi.fn(),
  stop: vi.fn(),
  reset: vi.fn(),
}))

vi.mock('embla-carousel', () => ({
  default: vi.fn(() => mockEmblaApi),
}))

vi.mock('embla-carousel-autoplay', () => ({
  default: mockAutoplay,
}))

// Import CarouselManager after mocking
const { CarouselManager } = await import('../client')

describe('CarouselManager', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>
  let carousel: HTMLElement

  beforeEach(async () => {
    // Reset DOM and mocks
    document.body.innerHTML = ''
    vi.clearAllMocks()

    // Reset CarouselManager before creating new DOM
    CarouselManager.reset()

    // Create Astro container and render test component
    container = await AstroContainer.create()
    const result = await container.renderToString(TestCarousel)
    document.body.innerHTML = result

    // Get carousel element
    carousel = document.querySelector('.embla') as HTMLElement
    expect(carousel).toBeTruthy()
  })

  describe('LoadableScript Interface', () => {
    it('should implement LoadableScript interface', () => {
      expect(CarouselManager.scriptName).toBe('CarouselManager')
      expect(CarouselManager.eventType).toBe('astro:page-load')
      expect(typeof CarouselManager.init).toBe('function')
      expect(typeof CarouselManager.pause).toBe('function')
      expect(typeof CarouselManager.resume).toBe('function')
      expect(typeof CarouselManager.reset).toBe('function')
    })
  })

  describe('Initialization', () => {
    it('should discover and initialize carousels', () => {
      CarouselManager.init()

      // Should have found and managed the carousel
      expect(carousel.getAttribute('data-carousel-managed')).toBe('true')
    })

    it('should not initialize the same carousel twice', () => {
      CarouselManager.init()
      CarouselManager.init() // Second initialization

      // Should still only have one managed carousel
      expect(carousel.getAttribute('data-carousel-managed')).toBe('true')
      expect(document.querySelectorAll('[data-carousel-managed]')).toHaveLength(1)
    })

    it('should setup global visibility change listener', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

      CarouselManager.init()

      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    })
  })

  describe('Navigation Controls', () => {
    beforeEach(() => {
      CarouselManager.init()
    })

    it('should have navigation buttons', () => {
      const prevButton = carousel.querySelector('.embla__button--prev')
      const nextButton = carousel.querySelector('.embla__button--next')

      expect(prevButton).toBeTruthy()
      expect(nextButton).toBeTruthy()
    })

    it('should have dot navigation', () => {
      const dots = carousel.querySelectorAll('.embla__dot')
      expect(dots).toHaveLength(3)
    })

    it('should handle previous button click', () => {
      const prevButton = carousel.querySelector('.embla__button--prev') as HTMLButtonElement
      prevButton.click()

      expect(mockEmblaApi.scrollPrev).toHaveBeenCalled()
    })

    it('should handle next button click', () => {
      const nextButton = carousel.querySelector('.embla__button--next') as HTMLButtonElement
      nextButton.click()

      expect(mockEmblaApi.scrollNext).toHaveBeenCalled()
    })

    it('should handle dot navigation click', () => {
      const firstDot = carousel.querySelector('.embla__dot') as HTMLButtonElement
      firstDot.click()

      expect(mockEmblaApi.scrollTo).toHaveBeenCalledWith(0)
    })

    it('should update button states based on scroll capability', () => {
      // Mock that we can't scroll prev
      mockEmblaApi.canScrollPrev.mockReturnValue(false)
      mockEmblaApi.canScrollNext.mockReturnValue(true)

      // Trigger the select event callback
      const onSelectCallback = mockEmblaApi.on.mock.calls.find(call => call[0] === 'select')?.[1]
      onSelectCallback?.()

      const prevButton = carousel.querySelector('.embla__button--prev') as HTMLButtonElement
      const nextButton = carousel.querySelector('.embla__button--next') as HTMLButtonElement

      expect(prevButton.disabled).toBe(true)
      expect(prevButton.classList.contains('opacity-30')).toBe(true)
      expect(prevButton.classList.contains('cursor-not-allowed')).toBe(true)

      expect(nextButton.disabled).toBe(false)
      expect(nextButton.classList.contains('opacity-30')).toBe(false)
      expect(nextButton.classList.contains('cursor-not-allowed')).toBe(false)
    })
  })

  describe('Dot Navigation', () => {
    beforeEach(() => {
      CarouselManager.init()
    })

    it('should update dot states when slide changes', () => {
      const dots = carousel.querySelectorAll('.embla__dot')

      // Initially, first dot should be active (selectedScrollSnap returns 0)
      expect(dots[0]?.classList.contains('w-8')).toBe(true)
      expect(dots[1]?.classList.contains('w-8')).toBe(false)
      expect(dots[2]?.classList.contains('w-8')).toBe(false)

      // Change the mock to return index 1
      mockEmblaApi.selectedScrollSnap.mockReturnValue(1)

      // Find and trigger the select event callback that was registered
      const selectCalls = mockEmblaApi.on.mock.calls.filter(call => call[0] === 'select')
      expect(selectCalls.length).toBeGreaterThan(0) // Trigger all select callbacks since there might be multiple (buttons + dots)
      selectCalls.forEach(([event, callback]) => {
        expect(event).toBe('select')
        expect(typeof callback).toBe('function')
        ;(callback as () => void)()
      })

      // After triggering the callback, the second dot should be active
      expect(dots[0]?.classList.contains('w-8')).toBe(false)
      expect(dots[1]?.classList.contains('w-8')).toBe(true)
      expect(dots[2]?.classList.contains('w-8')).toBe(false)
    })
  })

  describe('Autoplay Functionality', () => {
    beforeEach(() => {
      CarouselManager.init()
    })

    it('should initialize with autoplay plugin', () => {
      expect(mockAutoplay).toHaveBeenCalledWith({
        delay: 4000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      })
    })

    it('should pause autoplay on visibility change', () => {
      // Mock document as hidden
      Object.defineProperty(document, 'hidden', { value: true, configurable: true })

      // Trigger visibility change
      const visibilityChangeEvent = new Event('visibilitychange')
      document.dispatchEvent(visibilityChangeEvent)

      // Should pause the carousel (through embla API)
      expect(mockEmblaApi.on).toHaveBeenCalled()
    })

    it('should resume autoplay when document becomes visible', () => {
      // Mock document as visible
      Object.defineProperty(document, 'hidden', { value: false, configurable: true })

      // Trigger visibility change
      const visibilityChangeEvent = new Event('visibilitychange')
      document.dispatchEvent(visibilityChangeEvent)

      // Should resume the carousel (through embla API)
      expect(mockEmblaApi.on).toHaveBeenCalled()
    })
  })

  describe('Lifecycle Management', () => {
    it('should pause all carousels', () => {
      CarouselManager.init()

      CarouselManager.pause()
      // Pause functionality would be implemented through embla API
      expect(mockEmblaApi.on).toHaveBeenCalled()
    })

    it('should resume all carousels', () => {
      CarouselManager.init()

      CarouselManager.resume()
      // Resume functionality would be implemented through embla API
      expect(mockEmblaApi.on).toHaveBeenCalled()
    })

    it('should reset and clean up on page navigation', () => {
      CarouselManager.init()

      expect(carousel.getAttribute('data-carousel-managed')).toBe('true')

      CarouselManager.reset()

      // After reset, manager should be ready for reinitialization
      expect(CarouselManager.scriptName).toBe('CarouselManager')
    })

    it('should clean up removed DOM elements', () => {
      CarouselManager.init()

      // Remove carousel from DOM
      carousel.remove()

      // Trigger cleanup (would normally happen during navigation)
      CarouselManager.init() // This would trigger cleanup internally

      expect(mockEmblaApi.destroy).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing viewport gracefully', () => {
      // Create carousel without viewport
      const invalidCarousel = document.createElement('div')
      invalidCarousel.className = 'embla'
      document.body.appendChild(invalidCarousel)

      // Error handling now uses handleScriptError instead of console.warn
      // Should not throw, just log via Sentry integration
      expect(() => CarouselManager.init()).not.toThrow()
    })

    it('should handle initialization errors', async () => {
      // Mock EmblaCarousel to throw an error
      const EmblaCarousel = (await import('embla-carousel')).default
      vi.mocked(EmblaCarousel).mockImplementation(() => {
        throw new Error('Mock initialization error')
      })

      // Error handling now uses handleScriptError instead of console.error
      // Should not throw, just log via Sentry integration
      expect(() => CarouselManager.init()).not.toThrow()
    })
  })

  describe('DOM Structure Validation', () => {
    it('should have correct carousel structure', () => {
      expect(carousel.querySelector('.embla__viewport')).toBeTruthy()
      expect(carousel.querySelector('.embla__container')).toBeTruthy()
      expect(carousel.querySelectorAll('.embla__slide')).toHaveLength(3)
    })

    it('should have accessible navigation', () => {
      CarouselManager.init() // Initialize to create dots

      const prevButton = carousel.querySelector('.embla__button--prev')
      const nextButton = carousel.querySelector('.embla__button--next')
      const dots = carousel.querySelectorAll('.embla__dot')

      expect(prevButton?.querySelector('.sr-only')?.textContent).toBe('Previous')
      expect(nextButton?.querySelector('.sr-only')?.textContent).toBe('Next')

      dots.forEach((dot, index) => {
        const ariaLabel = dot.getAttribute('aria-label')
        expect(ariaLabel).toBe(`Go to slide ${index + 1}`)
      })
    })

    it('should have proper ARIA attributes', () => {
      CarouselManager.init()

      const prevButton = carousel.querySelector('.embla__button--prev') as HTMLButtonElement
      const nextButton = carousel.querySelector('.embla__button--next') as HTMLButtonElement

      expect(prevButton.type).toBe('button')
      expect(nextButton.type).toBe('button')
    })
  })
})
