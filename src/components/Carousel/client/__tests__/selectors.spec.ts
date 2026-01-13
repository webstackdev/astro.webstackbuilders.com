import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import CarouselComponent from '@components/Carousel/index.astro'
import type { CarouselProps } from '@components/Carousel/@types'
import type { CarouselElement } from '@components/Carousel/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { ClientScriptError } from '@components/scripts/errors'
import { executeRender } from '@test/unit/helpers/litRuntime'
import sampleCollection from '@components/Carousel/client/__fixtures__/collection.fixture'
import {
  getCarouselEmblaRoot,
  getCarouselViewport,
  queryCarouselDotsContainer,
  queryCarouselNextBtn,
  queryCarouselPrevBtn,
  queryCarouselSlides,
  queryCarouselStatusRegion,
} from '../selectors'

vi.mock('@components/scripts/store', () => ({
  createAnimationController: vi.fn(() => ({
    requestPlay: vi.fn(),
    requestPause: vi.fn(),
    setInstancePauseState: vi.fn(),
    clearUserPreference: vi.fn(),
    destroy: vi.fn(),
  })),
}))

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
      scrollSnapList: vi.fn(() => [0, 1, 2]),
      selectedScrollSnap: vi.fn(() => selectedIndex),
      scrollTo: vi.fn((index: number) => {
        selectedIndex = index
      }),
    }

    return api
  })

  return {
    default: createEmbla,
  }
})

vi.mock('embla-carousel-autoplay', () => ({
  __esModule: true,
  default: vi.fn(() => ({ play: vi.fn(), stop: vi.fn() })),
}))

type CarouselModule = WebComponentModule<CarouselElement>

const defaultCarouselProps: CarouselProps = {
  title: 'Featured Articles',
  limit: 3,
  variant: 'featured',
  currentSlug: 'article-two',
  type: 'articles',
}

const renderCarousel = async (
  assert: (_context: { root: CarouselElement }) => Promise<void> | void,
  props: Partial<CarouselProps> = {}
) => {
  const container = await AstroContainer.create()

  await executeRender<CarouselModule>({
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
      await assert({ root: element })
    },
  })
}

describe('Carousel selectors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stays in sync with the Carousel layout', async () => {
    await renderCarousel(
      ({ root }) => {
        const emblaRoot = getCarouselEmblaRoot(root)
        const viewport = getCarouselViewport(root)
        const slides = queryCarouselSlides(root)
        const dots = queryCarouselDotsContainer(root)
        const prevBtn = queryCarouselPrevBtn(root)
        const nextBtn = queryCarouselNextBtn(root)
        const statusRegion = queryCarouselStatusRegion(root)

        expect(emblaRoot, 'Carousel should render an Embla root with .embla').toBeInstanceOf(
          HTMLElement
        )
        expect(
          viewport,
          'Carousel should render an Embla viewport with .embla__viewport'
        ).toBeInstanceOf(HTMLElement)
        expect(
          slides.length,
          'Carousel should render at least one slide with [data-carousel-slide]'
        ).toBeGreaterThan(0)
        expect(dots, 'Carousel should render a dots container with .embla__dots').toBeInstanceOf(
          HTMLElement
        )
        expect(
          prevBtn,
          'Carousel should render a prev button with .embla__button--prev'
        ).toBeInstanceOf(HTMLButtonElement)
        expect(
          nextBtn,
          'Carousel should render a next button with .embla__button--next'
        ).toBeInstanceOf(HTMLButtonElement)
        expect(
          statusRegion,
          'Carousel should render a status region with [data-carousel-status]'
        ).toBeInstanceOf(HTMLElement)
      },
      { currentSlug: 'article-four', limit: 2, title: 'Latest Reads' }
    )
  })

  it('throws ClientScriptError when required nodes are missing', async () => {
    await renderCarousel(({ root }) => {
      root.querySelector('.embla')?.remove()
      expect(
        () => getCarouselEmblaRoot(root),
        'getCarouselEmblaRoot should throw when .embla is missing'
      ).toThrow(ClientScriptError)
    })

    await renderCarousel(({ root }) => {
      root.querySelector('.embla__viewport')?.remove()
      expect(
        () => getCarouselViewport(root),
        'getCarouselViewport should throw when .embla__viewport is missing'
      ).toThrow(ClientScriptError)
    })
  })
})
