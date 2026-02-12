import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import type { EmblaCarouselType } from 'embla-carousel'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import EmblaCarouselBaseFixture from '../__fixtures__/emblaCarouselBase.fixture.astro'
import type { EmblaBaseFixtureElement } from '../__fixtures__/EmblaBaseFixture.client'

type EmblaBaseModule = WebComponentModule<EmblaBaseFixtureElement>

const addButtonEventListenersMock = vi.hoisted(() => vi.fn())
const addScriptBreadcrumbMock = vi.hoisted(() => vi.fn())
const handleScriptErrorMock = vi.hoisted(() => vi.fn())
const createAnimationControllerMock = vi.hoisted(() => vi.fn())

const emblaInstanceRef = { current: null as EmblaApiMock | null }
const autoplayInstanceRef = { current: null as { play: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> } | null }

interface EmblaApiMock {
  canScrollPrev: ReturnType<typeof vi.fn>
  canScrollNext: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  off: ReturnType<typeof vi.fn>
  scrollPrev: ReturnType<typeof vi.fn>
  scrollNext: ReturnType<typeof vi.fn>
  scrollTo: ReturnType<typeof vi.fn>
  destroy: ReturnType<typeof vi.fn>
  scrollSnapList: ReturnType<typeof vi.fn>
  selectedScrollSnap: ReturnType<typeof vi.fn>
  __setCanScrollPrev: (_value: boolean) => void
  __setCanScrollNext: (_value: boolean) => void
  __setSelectedIndex: (_value: number) => void
  __trigger: (_event: 'select' | 'reInit' | 'autoplay:play' | 'autoplay:stop') => void
}

const createEmblaApiMock = (options: {
  canScrollPrev: boolean
  canScrollNext: boolean
  snapCount: number
  selectedIndex: number
}): EmblaApiMock => {
  let canScrollPrevValue = options.canScrollPrev
  let canScrollNextValue = options.canScrollNext
  let selectedIndexValue = options.selectedIndex
  const handlers = new Map<string, Array<() => void>>()

  return {
    canScrollPrev: vi.fn(() => canScrollPrevValue),
    canScrollNext: vi.fn(() => canScrollNextValue),
    on: vi.fn((event: string, handler: () => void) => {
      const existing = handlers.get(event) ?? []
      handlers.set(event, [...existing, handler])
      return undefined as unknown as EmblaCarouselType
    }),
    off: vi.fn((event: string) => {
      handlers.delete(event)
      return undefined as unknown as EmblaCarouselType
    }),
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    scrollTo: vi.fn(),
    destroy: vi.fn(),
    scrollSnapList: vi.fn(() => Array.from({ length: options.snapCount })),
    selectedScrollSnap: vi.fn(() => selectedIndexValue),
    __setCanScrollPrev: (value: boolean) => {
      canScrollPrevValue = value
    },
    __setCanScrollNext: (value: boolean) => {
      canScrollNextValue = value
    },
    __setSelectedIndex: (value: number) => {
      selectedIndexValue = value
    },
    __trigger: (event: 'select' | 'reInit' | 'autoplay:play' | 'autoplay:stop') => {
      const handlersForEvent = handlers.get(event) ?? []
      handlersForEvent.forEach(handler => {
        handler()
      })
    },
  }
}

vi.mock('embla-carousel', () => ({
  default: vi.fn(() => {
    const emblaApi = createEmblaApiMock({
      canScrollPrev: false,
      canScrollNext: true,
      snapCount: 3,
      selectedIndex: 0,
    })
    emblaInstanceRef.current = emblaApi
    return emblaApi
  }),
}))

vi.mock('embla-carousel-autoplay', () => ({
  default: vi.fn(() => {
    const instance = {
      play: vi.fn(),
      stop: vi.fn(),
    }
    autoplayInstanceRef.current = instance
    return instance
  }),
}))

vi.mock('@components/scripts/elementListeners', () => ({
  addButtonEventListeners: addButtonEventListenersMock,
}))

vi.mock('@components/scripts/errors', () => ({
  addScriptBreadcrumb: addScriptBreadcrumbMock,
}))

vi.mock('@components/scripts/errors/handler', () => ({
  handleScriptError: handleScriptErrorMock,
}))

vi.mock('@components/scripts/store', async () => {
  const actual = await vi.importActual<typeof import('@components/scripts/store')>(
    '@components/scripts/store'
  )

  return {
    ...actual,
    createAnimationController: createAnimationControllerMock,
  }
})

describe('EmblaCarouselBase', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
    emblaInstanceRef.current = null
    autoplayInstanceRef.current = null
    addButtonEventListenersMock.mockReset()
    createAnimationControllerMock.mockReturnValue({
      requestPlay: vi.fn(),
      requestPause: vi.fn(),
      setInstancePauseState: vi.fn(),
      clearUserPreference: vi.fn(),
      destroy: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const renderFixture = async (
    assertion: (_context: { element: EmblaBaseFixtureElement }) => Promise<void> | void
  ): Promise<void> => {
    await executeRender<EmblaBaseModule>({
      container,
      component: EmblaCarouselBaseFixture,
      moduleSpecifier: '@components/scripts/embla/__fixtures__/EmblaBaseFixture.client.ts',
      selector: 'embla-base-fixture',
      assert: async ({ element }) => {
        await assertion({ element })
      },
    })
  }

  it('initializes embla, nav buttons, dots, and aria controls', async () => {
    await renderFixture(async ({ element }) => {
      const emblaApi = emblaInstanceRef.current
      expect(emblaApi).toBeTruthy()

      expect(element.getAttribute('data-carousel-ready')).toBe('true')

      const viewport = element.querySelector('[data-embla-viewport]') as HTMLElement | null
      expect(viewport).toBeTruthy()
      const viewportId = viewport?.getAttribute('id') ?? ''
      expect(viewportId.length).toBeGreaterThan(0)

      const prevBtn = element.querySelector('[data-embla-prev]') as HTMLButtonElement | null
      const nextBtn = element.querySelector('[data-embla-next]') as HTMLButtonElement | null
      expect(prevBtn?.getAttribute('aria-controls')).toBe(viewportId)
      expect(nextBtn?.getAttribute('aria-controls')).toBe(viewportId)

      const dotsContainer = element.querySelector('[data-embla-dots]') as HTMLElement | null
      expect(dotsContainer).toBeTruthy()
      const dots = Array.from(dotsContainer?.querySelectorAll('button') ?? [])
      expect(dots.length).toBe(3)

      const activeDot = dots[0]
      const inactiveDot = dots[1]
      if (!activeDot || !inactiveDot) {
        throw new Error('Expected at least two dot buttons')
      }

      expect(activeDot.getAttribute('aria-current')).toBe('true')
      expect(activeDot.classList.contains('is-active')).toBe(true)
      expect(activeDot.getAttribute('aria-controls')).toBe(viewportId)

      expect(inactiveDot.getAttribute('aria-current')).toBeNull()
      expect(inactiveDot.classList.contains('is-active')).toBe(false)
    })
  })

  it('updates navigation and dot state on Embla events', async () => {
    await renderFixture(async ({ element }) => {
      const emblaApi = emblaInstanceRef.current
      if (!emblaApi) {
        throw new Error('Expected Embla API instance')
      }

      const prevBtn = element.querySelector('[data-embla-prev]') as HTMLButtonElement | null
      const nextBtn = element.querySelector('[data-embla-next]') as HTMLButtonElement | null
      const dotsContainer = element.querySelector('[data-embla-dots]') as HTMLElement | null
      const dots = Array.from(dotsContainer?.querySelectorAll('button') ?? [])

      expect(prevBtn?.getAttribute('disabled')).toBe('true')
      expect(nextBtn?.hasAttribute('disabled')).toBe(false)

      emblaApi.__setCanScrollPrev(true)
      emblaApi.__setCanScrollNext(false)
      emblaApi.__setSelectedIndex(2)
      emblaApi.__trigger('select')

      expect(prevBtn?.hasAttribute('disabled')).toBe(false)
      expect(nextBtn?.getAttribute('disabled')).toBe('true')

      const thirdDot = dots[2]
      if (!thirdDot) {
        throw new Error('Expected third dot button to exist')
      }
      expect(thirdDot.getAttribute('aria-current')).toBe('true')
    })
  })

  it('wires dot and nav click handlers to Embla methods', async () => {
    const buttonHandlers = new Map<HTMLElement, () => void>()
    addButtonEventListenersMock.mockImplementation((button, handler) => {
      buttonHandlers.set(button as HTMLElement, handler as () => void)
    })

    await renderFixture(async ({ element }) => {
      const emblaApi = emblaInstanceRef.current
      if (!emblaApi) {
        throw new Error('Expected Embla API instance')
      }

      const prevBtn = element.querySelector('[data-embla-prev]') as HTMLButtonElement | null
      const nextBtn = element.querySelector('[data-embla-next]') as HTMLButtonElement | null
      const dotsContainer = element.querySelector('[data-embla-dots]') as HTMLElement | null
      const dots = Array.from(dotsContainer?.querySelectorAll('button') ?? [])

      if (!prevBtn || !nextBtn || dots.length === 0) {
        throw new Error('Missing navigation elements')
      }

      const prevHandler = buttonHandlers.get(prevBtn)
      const nextHandler = buttonHandlers.get(nextBtn)
      const secondDot = dots[1]
      if (!secondDot) {
        throw new Error('Expected second dot button to exist')
      }
      const secondDotHandler = buttonHandlers.get(secondDot)

      prevHandler?.()
      nextHandler?.()
      secondDotHandler?.()

      expect(emblaApi.scrollPrev).toHaveBeenCalled()
      expect(emblaApi.scrollNext).toHaveBeenCalled()
      expect(emblaApi.scrollTo).toHaveBeenCalledWith(1)
    })
  })

  it('schedules autoplay and plays after resume when ready', async () => {
    vi.useFakeTimers()

    await renderFixture(async ({ element }) => {
      const autoplayInstance = autoplayInstanceRef.current
      if (!autoplayInstance) {
        throw new Error('Expected autoplay instance')
      }

      element.resume()
      vi.runAllTimers()

      expect(autoplayInstance.play).toHaveBeenCalled()
      expect(element.getAttribute('data-carousel-autoplay')).toBe('playing')

      element.pause()
      expect(autoplayInstance.stop).toHaveBeenCalled()
      expect(element.getAttribute('data-carousel-autoplay')).toBe('paused')

      expect(createAnimationControllerMock).toHaveBeenCalled()
    })
  })

  it('tears down Embla state on disconnect', async () => {
    await renderFixture(async ({ element }) => {
      const emblaApi = emblaInstanceRef.current
      if (!emblaApi) {
        throw new Error('Expected Embla API instance')
      }

      expect(element.getAttribute('data-carousel-ready')).toBe('true')

      element.remove()

      expect(emblaApi.destroy).toHaveBeenCalled()
      expect(element.getAttribute('data-carousel-ready')).toBeNull()
      expect(element.getAttribute('data-carousel-autoplay')).toBeNull()
    })
  })
})