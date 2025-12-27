import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TestimonialsComponent from '@components/Testimonials/index.astro'
import type { TestimonialsProps } from '@components/Testimonials/props'
import type { TestimonialsCarouselElement } from '@components/Testimonials/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import testimonialsCollection from '@components/Testimonials/client/__fixtures__/collection.fixture'

const createAnimationControllerMock = vi.fn((config?: { onPlay?: () => void }) => {
  config?.onPlay?.()
  return {
    requestPlay: vi.fn(),
    requestPause: vi.fn(),
    clearUserPreference: vi.fn(),
    destroy: vi.fn(),
  }
})

type AutoplayPluginInstance = {
  play: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
}

const autoplayPluginInstances: AutoplayPluginInstance[] = []

const createAutoplayPluginMock = vi.fn(() => {
  const instance: AutoplayPluginInstance = {
    play: vi.fn(),
    stop: vi.fn(),
  }
  autoplayPluginInstances.push(instance)
  return instance
})

let intersectionObserverCallback: IntersectionObserverCallback | undefined

const originalIntersectionObserver = (
  globalThis as unknown as { IntersectionObserver?: typeof IntersectionObserver }
).IntersectionObserver

class IntersectionObserverMock {
  observe = vi.fn()
  disconnect = vi.fn()

  constructor(callback: IntersectionObserverCallback) {
    intersectionObserverCallback = callback
  }
}

vi.mock('@components/scripts/store', () => ({
  createAnimationController: createAnimationControllerMock,
}))

type TestimonialsModule = WebComponentModule<TestimonialsCarouselElement>

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async () => testimonialsCollection),
}))

vi.mock('embla-carousel', () => {
  const createEmbla = vi.fn(() => {
    const api = {
      canScrollPrev: vi.fn(() => false),
      canScrollNext: vi.fn(() => true),
      scrollPrev: vi.fn(),
      scrollNext: vi.fn(),
      scrollTo: vi.fn(),
      on: vi.fn(() => api),
      off: vi.fn(() => api),
      destroy: vi.fn(),
      scrollSnapList: vi.fn(() => {
        const slides = globalThis.document?.querySelectorAll('.embla__slide').length ?? 0
        return Array.from({ length: slides }, (_, index) => index)
      }),
      selectedScrollSnap: vi.fn(() => 0),
    }

    return api
  })

  return {
    default: createEmbla,
  }
})

vi.mock('embla-carousel-autoplay', () => ({
  __esModule: true,
  default: createAutoplayPluginMock,
}))

const defaultProps: TestimonialsProps = {
  title: 'Client Praise',
}

const renderTestimonials = async (
  assertion: (_context: { root: TestimonialsCarouselElement }) => Promise<void> | void,
  props: Partial<TestimonialsProps> = {}
) => {
  const container = await AstroContainer.create()

  await executeRender<TestimonialsModule>({
    container,
    component: TestimonialsComponent,
    moduleSpecifier: '@components/Testimonials/client/index',
    args: {
      props: {
        ...defaultProps,
        ...props,
      },
    },
    assert: async ({ element }) => {
      await assertion({ root: element })
    },
  })
}

describe('Testimonials component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createAnimationControllerMock.mockClear()
    autoplayPluginInstances.length = 0
    createAutoplayPluginMock.mockClear()
    intersectionObserverCallback = undefined
    ;(
      globalThis as unknown as { IntersectionObserver?: typeof IntersectionObserver }
    ).IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver
  })

  afterEach(() => {
    const globalIntersection = globalThis as unknown as {
      IntersectionObserver?: typeof IntersectionObserver
    }
    if (originalIntersectionObserver) {
      globalIntersection.IntersectionObserver = originalIntersectionObserver
      return
    }
    delete globalIntersection.IntersectionObserver
  })

  it('renders the supplied title and respects the limit', async () => {
    await renderTestimonials(
      ({ root }) => {
        const heading = root.querySelector('h2')
        const slides = root.querySelectorAll('.embla__slide')
        const quoteIcon = root.querySelector('article svg')

        expect(heading?.textContent).toBe('Trusted Partners')
        expect(slides).toHaveLength(2)

        expect(root.getAttribute('role')).toBe('region')
        expect(root.getAttribute('aria-roledescription')).toBe('carousel')
        expect(root.getAttribute('aria-label')).toBe('Trusted Partners')

        const firstSlide = slides.item(0)
        expect(firstSlide.getAttribute('role')).toBe('group')
        expect(firstSlide.getAttribute('aria-roledescription')).toBe('slide')
        expect(firstSlide.getAttribute('aria-label')).toBe('Testimonial 1 of 2')

        expect(quoteIcon?.getAttribute('aria-hidden')).toBe('true')
        expect(quoteIcon?.getAttribute('focusable')).toBe('false')
      },
      { title: 'Trusted Partners', limit: 2 }
    )
  })

  it('omits navigation controls when only one testimonial is present', async () => {
    await renderTestimonials(
      ({ root }) => {
        expect(root.querySelector('.embla__button--prev')).toBeNull()
        expect(root.querySelector('.embla__dots')).toBeNull()
        expect(root.querySelector('[data-testimonials-autoplay-toggle]')).toBeNull()
      },
      { limit: 1 }
    )
  })

  it('registers the web component and generates pagination dots', async () => {
    await renderTestimonials(({ root }) => {
      const dots = root.querySelectorAll('.embla__dot')
      const viewport = root.querySelector('.embla__viewport')
      const prevBtn = root.querySelector('.embla__button--prev')
      const nextBtn = root.querySelector('.embla__button--next')
      const autoplayToggle = root.querySelector('[data-testimonials-autoplay-toggle]')
      const prevIcon = root.querySelector('.embla__button--prev svg')
      const nextIcon = root.querySelector('.embla__button--next svg')

      expect(root.getAttribute('data-carousel-ready')).toBe('true')
      expect(root.getAttribute('data-carousel-autoplay')).toBe('playing')
      expect(dots.length).toBeGreaterThan(0)

      expect(viewport?.getAttribute('id')).toMatch(/^testimonials-\d+-viewport$/)
      const viewportId = viewport?.getAttribute('id')
      expect(viewportId).toBeTruthy()

      dots.forEach(dot => {
        expect(dot.getAttribute('aria-controls')).toBe(viewportId)
      })
      expect(prevBtn?.getAttribute('aria-controls')).toBe(viewportId)
      expect(nextBtn?.getAttribute('aria-controls')).toBe(viewportId)
      expect(autoplayToggle?.getAttribute('aria-controls')).toBe(viewportId)

      expect(autoplayToggle?.getAttribute('aria-label')).toBe('Pause testimonials')
      expect(autoplayToggle?.getAttribute('aria-pressed')).toBe('false')

      expect(prevIcon?.getAttribute('aria-hidden')).toBe('true')
      expect(prevIcon?.getAttribute('focusable')).toBe('false')
      expect(nextIcon?.getAttribute('aria-hidden')).toBe('true')
      expect(nextIcon?.getAttribute('focusable')).toBe('false')
    })
  })

  it('registers an animation lifecycle controller', async () => {
    await renderTestimonials(() => {
      expect(createAnimationControllerMock).toHaveBeenCalled()
    })
  })

  it('defers autoplay activation until Embla is ready', async () => {
    vi.useFakeTimers()
    try {
      await renderTestimonials(async () => {
        const pluginInstance = autoplayPluginInstances.at(-1)
        expect(pluginInstance?.play).not.toHaveBeenCalled()
        await vi.runAllTimersAsync()
        expect(pluginInstance?.play).toHaveBeenCalled()
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauses autoplay when partially out of the viewport and resumes when fully visible again', async () => {
    vi.useFakeTimers()
    try {
      await renderTestimonials(async () => {
        const pluginInstance = autoplayPluginInstances.at(-1)
        expect(pluginInstance).toBeDefined()
        expect(intersectionObserverCallback).toBeTypeOf('function')

        intersectionObserverCallback?.(
          [
            {
              isIntersecting: true,
              intersectionRatio: 0.5,
            } as unknown as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        )

        await vi.runAllTimersAsync()
        expect(pluginInstance?.play).not.toHaveBeenCalled()

        intersectionObserverCallback?.(
          [
            {
              isIntersecting: true,
              intersectionRatio: 1,
            } as unknown as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        )

        expect(pluginInstance?.play).toHaveBeenCalled()
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('toggles autoplay via the pause/play button', async () => {
    await renderTestimonials(async ({ root }) => {
      const autoplayToggle = root.querySelector('[data-testimonials-autoplay-toggle]')
      expect(autoplayToggle).toBeTruthy()

      const toggleBtn = autoplayToggle as HTMLButtonElement
      expect(root.getAttribute('data-carousel-autoplay')).toBe('playing')
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('false')
      expect(toggleBtn.getAttribute('aria-label')).toBe('Pause testimonials')

      toggleBtn.click()

      expect(root.getAttribute('data-carousel-autoplay')).toBe('paused')
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('true')
      expect(toggleBtn.getAttribute('aria-label')).toBe('Play testimonials')

      toggleBtn.click()

      expect(root.getAttribute('data-carousel-autoplay')).toBe('playing')
      expect(toggleBtn.getAttribute('aria-pressed')).toBe('false')
      expect(toggleBtn.getAttribute('aria-label')).toBe('Pause testimonials')
    })
  })
})
