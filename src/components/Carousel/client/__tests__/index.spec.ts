import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import CarouselComponent from '@components/Carousel/index.astro'
import type { CarouselProps } from '@components/Carousel/@types'
import type { CarouselElement } from '@components/Carousel/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import sampleCollection from '@components/Carousel/client/__fixtures__/collection.fixture'

const createAnimationControllerMock = vi.fn((config?: { onPlay?: () => void }) => {
  config?.onPlay?.()
  return {
    requestPlay: vi.fn(),
    requestPause: vi.fn(),
    setInstancePauseState: vi.fn(),
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

let mockScrollSnaps = [0, 1, 2]

const setMockScrollSnaps = (snapCount: number) => {
  const count = Math.max(1, snapCount)
  mockScrollSnaps = Array.from({ length: count }, (_, index) => index)
}

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

type CarouselComponentModule = WebComponentModule<CarouselElement>

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async () => sampleCollection),
}))

vi.mock('embla-carousel', () => {
  const createEmbla = vi.fn(() => {
    const handlers = new Map<string, Array<() => void>>()
    let selectedIndex = 0

    const api = {
      canScrollPrev: vi.fn(() => false),
      canScrollNext: vi.fn(() => false),
      scrollPrev: vi.fn(),
      scrollNext: vi.fn(),
      on: vi.fn((event: string, handler: () => void) => {
        const existing = handlers.get(event) ?? []
        handlers.set(event, [...existing, handler])
        return api
      }),
      off: vi.fn((event: string, handler: () => void) => {
        const existing = handlers.get(event) ?? []
        handlers.set(
          event,
          existing.filter(entry => entry !== handler)
        )
        return api
      }),
      destroy: vi.fn(),
      scrollSnapList: vi.fn(() => mockScrollSnaps),
      selectedScrollSnap: vi.fn(() => selectedIndex),
      scrollTo: vi.fn((index: number) => {
        selectedIndex = index
      }),
      __trigger: (event: string) => {
        ;(handlers.get(event) ?? []).forEach(handler => handler())
      },
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

const defaultCarouselProps: CarouselProps = {
  title: 'Featured Articles',
  limit: 3,
  variant: 'featured',
  currentSlug: 'article-two',
  type: 'articles',
}

/**
 * Renders the Carousel component in a shared JSDOM instance and exposes the hydrated element.
 */
const renderCarousel = async (
  assertion: (_context: { root: CarouselElement }) => Promise<void> | void,
  props: Partial<CarouselProps> = {}
) => {
  const container = await AstroContainer.create()

  await executeRender<CarouselComponentModule>({
    container,
    component: CarouselComponent,
    moduleSpecifier: '@components/Carousel/client/index',
    args: {
      props: {
        ...defaultCarouselProps,
        ...props,
      },
    },
    assert: async ({ element }) => {
      await assertion({ root: element })
    },
  })
}

describe('Carousel component (server output)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createAnimationControllerMock.mockClear()
    autoplayPluginInstances.length = 0
    createAutoplayPluginMock.mockClear()
    setMockScrollSnaps(3)
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

  it('renders the provided title and respects the requested limit', async () => {
    await renderCarousel(
      ({ root }) => {
        const heading = root.querySelector('h2')
        const slides = root.querySelectorAll('[data-carousel-slide]')
        const region = root.querySelector('.embla')
        const dotsContainer = root.querySelector('[data-carousel-pagination]')
        const statusRegion = root.querySelector('[data-carousel-status]')
        const prevIcon = root.querySelector('.embla__button--prev svg')
        const nextIcon = root.querySelector('.embla__button--next svg')
        const learnMoreIcon = root.querySelector('[data-carousel-slide] svg')

        expect(heading?.textContent).toBe('Latest Reads')
        expect(slides).toHaveLength(2)

        expect(heading?.id).toBeTruthy()
        expect(region?.getAttribute('aria-labelledby')).toBe(heading?.id)
        expect(dotsContainer?.getAttribute('aria-label')).toBe('Latest Reads slide navigation')

        expect(prevIcon?.getAttribute('aria-hidden')).toBe('true')
        expect(nextIcon?.getAttribute('aria-hidden')).toBe('true')
        expect(learnMoreIcon?.getAttribute('aria-hidden')).toBe('true')

        expect(statusRegion?.getAttribute('role')).toBe('status')
        expect(statusRegion?.getAttribute('aria-live')).toBe('polite')
        expect(statusRegion?.textContent).toBe('Slide 1 of 3')
      },
      { title: 'Latest Reads', limit: 2, currentSlug: 'article-four' }
    )
  })

  it('assigns aria-controls to pagination dots and navigation buttons', async () => {
    await renderCarousel(({ root }) => {
      const viewport = root.querySelector('.embla__viewport')
      const viewportId = viewport?.getAttribute('id')
      const dots = root.querySelectorAll('.embla__dot')
      const prevBtn = root.querySelector('.embla__button--prev')
      const nextBtn = root.querySelector('.embla__button--next')

      expect(viewportId).toMatch(/^carousel-\d+-viewport$/)
      expect(dots.length).toBeGreaterThan(0)

      dots.forEach(dot => {
        expect(dot.getAttribute('aria-controls')).toBe(viewportId)
      })
      expect(prevBtn?.getAttribute('aria-controls')).toBe(viewportId)
      expect(nextBtn?.getAttribute('aria-controls')).toBe(viewportId)
    })
  })

  it('excludes the current slug from rendered cards', async () => {
    await renderCarousel(
      ({ root }) => {
        const links = Array.from(root.querySelectorAll('a[href^="/articles/"]'))
        const hrefs = links.map(link => link.getAttribute('href'))

        expect(hrefs).not.toContain('/articles/article-one')
      },
      { currentSlug: 'article-one' }
    )
  })

  it('renders featured items with icons when available', async () => {
    await renderCarousel(({ root }) => {
      const cardWithIcon = root.querySelector('[data-carousel-slide] img')

      expect(cardWithIcon).toBeTruthy()
      expect(cardWithIcon?.getAttribute('src')).toMatch(/^\/_image\?href=/)
      expect(cardWithIcon?.getAttribute('alt')).toBe('Cover image for Article One')
    })
  })

  it('orders suggested items by publish date when variant is suggested', async () => {
    await renderCarousel(
      ({ root }) => {
        const cardTitles = Array.from(root.querySelectorAll('[data-carousel-slide] h3')).map(
          title => title.textContent?.trim()
        )

        expect(cardTitles[0]).toBe('Article Four')
        expect(cardTitles[1]).toBe('Article Three')
      },
      { variant: 'suggested', limit: 3 }
    )
  })

  it('renders randomized order when variant is random', async () => {
    await renderCarousel(
      ({ root }) => {
        const cardTitles = Array.from(root.querySelectorAll('[data-carousel-slide] h3')).map(
          title => title.textContent?.trim()
        )

        expect(cardTitles).toHaveLength(3)
        expect(new Set(cardTitles)).toEqual(
          new Set(['Article Four', 'Article Three', 'Article One'])
        )
      },
      { variant: 'random', limit: 3 }
    )
  })

  it('registers an animation lifecycle controller', async () => {
    await renderCarousel(
      () => {
        expect(createAnimationControllerMock).toHaveBeenCalled()
      },
      { currentSlug: 'article-four' }
    )
  })

  it('defers autoplay activation until Embla is ready', async () => {
    vi.useFakeTimers()
    try {
      await renderCarousel(
        async () => {
          const pluginInstance = autoplayPluginInstances.at(-1)
          expect(pluginInstance).toBeDefined()
          expect(pluginInstance?.play).not.toHaveBeenCalled()
          await vi.runAllTimersAsync()
          expect(pluginInstance?.play).toHaveBeenCalled()
        },
        { currentSlug: 'article-four' }
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('pauses autoplay when partially out of the viewport and resumes when fully visible again', async () => {
    vi.useFakeTimers()
    try {
      await renderCarousel(
        async () => {
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
        },
        { currentSlug: 'article-four' }
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('skips autoplay wiring when Embla reports a single snap', async () => {
    setMockScrollSnaps(1)
    await renderCarousel(
      ({ root }) => {
        expect(createAnimationControllerMock).not.toHaveBeenCalled()
        expect(root.getAttribute('data-carousel-autoplay')).toBe('paused')
        expect(autoplayPluginInstances.at(-1)?.play).not.toHaveBeenCalled()
      },
      { currentSlug: 'article-four' }
    )
  })

  it('supports ArrowLeft/ArrowRight navigation when focus is inside the carousel', async () => {
    await renderCarousel(({ root }) => {
      const emblaApi = (
        root.querySelector('.embla') as unknown as {
          __emblaApi__?: { scrollPrev: () => void; scrollNext: () => void }
        }
      ).__emblaApi__
      expect(emblaApi).toBeDefined()

      const prevButton = root.querySelector('.embla__button--prev') as HTMLButtonElement | null
      expect(prevButton).toBeInstanceOf(HTMLButtonElement)
      prevButton?.focus()

      const keyboardEventCtor = root.ownerDocument.defaultView?.KeyboardEvent
      expect(keyboardEventCtor).toBeDefined()

      root.dispatchEvent(new keyboardEventCtor!('keyup', { key: 'ArrowLeft', bubbles: true }))
      root.dispatchEvent(new keyboardEventCtor!('keyup', { key: 'ArrowRight', bubbles: true }))

      expect(emblaApi?.scrollPrev).toHaveBeenCalledTimes(1)
      expect(emblaApi?.scrollNext).toHaveBeenCalledTimes(1)
    })
  })
})
