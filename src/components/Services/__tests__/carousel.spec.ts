/**
 * Unit tests for Services carousel functionality
 * Tests the setupServicesCarousel function and Embla Carousel integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupCarouselDOM, mockServices } from './testHelper'

// Mock embla-carousel
vi.mock('embla-carousel', () => ({
  default: vi.fn(() => ({
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    scrollTo: vi.fn(),
    canScrollPrev: vi.fn(() => true),
    canScrollNext: vi.fn(() => true),
    selectedScrollSnap: vi.fn(() => 0),
    scrollSnapList: vi.fn(() => [0, 1, 2]),
    on: vi.fn(),
  })),
}))

// Mock embla-carousel-autoplay
vi.mock('embla-carousel-autoplay', () => ({
  default: vi.fn(() => ({})),
}))

describe('Services Carousel', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    // Setup fresh DOM for each test
    setupCarouselDOM()
  })

  describe('setupServicesCarousel', () => {
    it('should find carousel container and viewport', async () => {
      const { setupServicesCarousel } = await import('../index')

      setupServicesCarousel()

      const emblaContainer = document.querySelector('.embla')
      const viewport = document.querySelector('.embla__viewport')

      expect(emblaContainer).toBeTruthy()
      expect(viewport).toBeTruthy()
    })

    it('should warn if carousel container is not found', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      document.body.innerHTML = '<div></div>'

      const { setupServicesCarousel } = await import('../index')
      setupServicesCarousel()

      expect(consoleSpy).toHaveBeenCalledWith('Services carousel container not found')
      consoleSpy.mockRestore()
    })

    it('should warn if viewport is not found', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      document.body.innerHTML = '<div class="embla"></div>'

      const { setupServicesCarousel } = await import('../index')
      setupServicesCarousel()

      expect(consoleSpy).toHaveBeenCalledWith('Services carousel viewport not found')
      consoleSpy.mockRestore()
    })

    it('should initialize Embla Carousel with correct options', async () => {
      const EmblaCarousel = (await import('embla-carousel')).default
      const { setupServicesCarousel } = await import('../index')

      setupServicesCarousel()

      expect(EmblaCarousel).toHaveBeenCalled()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [viewport, options] = (EmblaCarousel as any).mock.calls[0]

      expect(viewport).toBe(document.querySelector('.embla__viewport'))
      expect(options).toEqual({
        loop: true,
        align: 'start',
        skipSnaps: false,
        dragFree: false,
      })
    })

    it('should initialize with Autoplay plugin', async () => {
      const Autoplay = (await import('embla-carousel-autoplay')).default
      const { setupServicesCarousel } = await import('../index')

      setupServicesCarousel()

      expect(Autoplay).toHaveBeenCalledWith({
        delay: 4000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      })
    })
  })

  describe('Navigation Buttons', () => {
    it('should setup prev and next button click handlers', async () => {
      const { setupServicesCarousel } = await import('../index')
      const EmblaCarousel = (await import('embla-carousel')).default

      setupServicesCarousel()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockApi = (EmblaCarousel as any).mock.results[0].value
      const prevBtn = document.querySelector('.embla__button--prev') as HTMLButtonElement
      const nextBtn = document.querySelector('.embla__button--next') as HTMLButtonElement

      expect(prevBtn).toBeTruthy()
      expect(nextBtn).toBeTruthy()

      prevBtn.click()
      expect(mockApi.scrollPrev).toHaveBeenCalled()

      nextBtn.click()
      expect(mockApi.scrollNext).toHaveBeenCalled()
    })

    it('should update button states based on scroll position', async () => {
      const { setupServicesCarousel } = await import('../index')
      const EmblaCarousel = (await import('embla-carousel')).default

      setupServicesCarousel()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockApi = (EmblaCarousel as any).mock.results[0].value

      // Verify event listeners were registered
      expect(mockApi.on).toHaveBeenCalledWith('select', expect.any(Function))
      expect(mockApi.on).toHaveBeenCalledWith('reInit', expect.any(Function))
    })

    it('should disable prev button when cannot scroll prev', async () => {
      const { setupServicesCarousel } = await import('../index')
      const EmblaCarousel = (await import('embla-carousel')).default

      // Mock canScrollPrev to return false
      const mockApi = {
        scrollPrev: vi.fn(),
        scrollNext: vi.fn(),
        scrollTo: vi.fn(),
        canScrollPrev: vi.fn(() => false),
        canScrollNext: vi.fn(() => true),
        selectedScrollSnap: vi.fn(() => 0),
        scrollSnapList: vi.fn(() => [0, 1, 2]),
        on: vi.fn((event, callback) => {
          // Immediately call the callback for 'select' and 'reInit'
          if (event === 'select' || event === 'reInit') {
            callback()
          }
        }),
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(EmblaCarousel as any).mockReturnValueOnce(mockApi)

      setupServicesCarousel()

      const prevBtn = document.querySelector('.embla__button--prev') as HTMLButtonElement

      expect(prevBtn.hasAttribute('disabled')).toBe(true)
      expect(prevBtn.classList.contains('opacity-30')).toBe(true)
      expect(prevBtn.classList.contains('cursor-not-allowed')).toBe(true)
    })
  })

  describe('Dot Navigation', () => {
    it('should create dot buttons for each slide', async () => {
      const { setupServicesCarousel } = await import('../index')

      setupServicesCarousel()

      const dots = document.querySelectorAll('.embla__dot')
      expect(dots.length).toBe(3) // 3 slides from mockServices
    })

    it('should add click handlers to dots', async () => {
      const { setupServicesCarousel } = await import('../index')
      const EmblaCarousel = (await import('embla-carousel')).default

      setupServicesCarousel()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockApi = (EmblaCarousel as any).mock.results[0].value
      const dots = document.querySelectorAll('.embla__dot')

      expect(dots[1]).toBeTruthy()
      dots[1]!.dispatchEvent(new Event('click'))

      expect(mockApi.scrollTo).toHaveBeenCalledWith(1)
    })

    it('should set correct aria-label for each dot', async () => {
      const { setupServicesCarousel } = await import('../index')

      setupServicesCarousel()

      const dots = document.querySelectorAll('.embla__dot')

      expect(dots[0]!.getAttribute('aria-label')).toBe('Go to slide 1')
      expect(dots[1]!.getAttribute('aria-label')).toBe('Go to slide 2')
      expect(dots[2]!.getAttribute('aria-label')).toBe('Go to slide 3')
    })

    it('should update dot styles based on selected slide', async () => {
      const { setupServicesCarousel } = await import('../index')
      const EmblaCarousel = (await import('embla-carousel')).default

      const mockApi = {
        scrollPrev: vi.fn(),
        scrollNext: vi.fn(),
        scrollTo: vi.fn(),
        canScrollPrev: vi.fn(() => true),
        canScrollNext: vi.fn(() => true),
        selectedScrollSnap: vi.fn(() => 0),
        scrollSnapList: vi.fn(() => [0, 1, 2]),
        on: vi.fn((event, callback) => {
          if (event === 'select' || event === 'reInit') {
            callback()
          }
        }),
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(EmblaCarousel as any).mockReturnValueOnce(mockApi)

      setupServicesCarousel()

      const dots = document.querySelectorAll<HTMLElement>('.embla__dot')

      // First dot should be active
      expect(dots[0]!.classList.contains('bg-[color:var(--color-primary)]')).toBe(true)
      expect(dots[0]!.classList.contains('w-8')).toBe(true)

      // Other dots should not be active
      expect(dots[1]!.classList.contains('bg-[color:var(--color-text-offset)]')).toBe(true)
      expect(dots[1]!.classList.contains('w-2')).toBe(true)
    })

    it('should update dot styles based on selected slide', async () => {
      const { setupServicesCarousel } = await import('../index')
      const EmblaCarousel = (await import('embla-carousel')).default

      const mockApi = {
        scrollPrev: vi.fn(),
        scrollNext: vi.fn(),
        scrollTo: vi.fn(),
        canScrollPrev: vi.fn(() => true),
        canScrollNext: vi.fn(() => true),
        selectedScrollSnap: vi.fn(() => 0),
        scrollSnapList: vi.fn(() => [0, 1, 2]),
        on: vi.fn((event, callback) => {
          if (event === 'select' || event === 'reInit') {
            callback()
          }
        }),
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(EmblaCarousel as any).mockReturnValueOnce(mockApi)

      setupServicesCarousel()

      const dots = document.querySelectorAll<HTMLElement>('.embla__dot')

      // First dot should be active
      expect(dots[0]!.classList.contains('bg-[color:var(--color-primary)]')).toBe(true)
      expect(dots[0]!.classList.contains('w-8')).toBe(true)

      // Other dots should not be active
      expect(dots[1]!.classList.contains('bg-[color:var(--color-text-offset)]')).toBe(true)
      expect(dots[1]!.classList.contains('w-2')).toBe(true)
    })

    it('should register event listeners for dot updates', async () => {
      const { setupServicesCarousel } = await import('../index')
      const EmblaCarousel = (await import('embla-carousel')).default

      setupServicesCarousel()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockApi = (EmblaCarousel as any).mock.results[0].value

      // Check that on() was called for select and reInit events (twice: once for buttons, once for dots)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectCalls = (mockApi.on as any).mock.calls.filter((call: [string, () => void]) => call[0] === 'select')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reInitCalls = (mockApi.on as any).mock.calls.filter((call: [string, () => void]) => call[0] === 'reInit')

      expect(selectCalls.length).toBeGreaterThanOrEqual(1)
      expect(reInitCalls.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Carousel Slides', () => {
    it('should render all service slides', () => {
      const slides = document.querySelectorAll('.embla__slide')
      expect(slides.length).toBe(mockServices.length)
    })

    it('should have correct link URLs for each service', () => {
      const links = document.querySelectorAll<HTMLAnchorElement>('.embla__slide a')

      expect(links[0]!.getAttribute('href')).toBe('/services/service-1/')
      expect(links[1]!.getAttribute('href')).toBe('/services/service-2/')
      expect(links[2]!.getAttribute('href')).toBe('/services/service-3/')
    })

    it('should display service titles and descriptions', () => {
      const titles = document.querySelectorAll('.embla__slide h3')
      const descriptions = document.querySelectorAll('.embla__slide p')

      expect(titles[0]!.textContent?.trim()).toBe('Web Development')
      expect(descriptions[0]!.textContent?.trim()).toBe('Build modern, responsive websites')
    })
  })

  describe('Initialization Logging', () => {
    it('should log successful initialization', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const { setupServicesCarousel } = await import('../index')
      setupServicesCarousel()

      expect(consoleSpy).toHaveBeenCalledWith('Services carousel initialized with autoplay')
      consoleSpy.mockRestore()
    })
  })
})
