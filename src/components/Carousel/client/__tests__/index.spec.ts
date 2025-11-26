// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import CarouselComponent from '@components/Carousel/index.astro'
import type { CarouselProps } from '@components/Carousel/props'
import type { CarouselElement } from '@components/Carousel/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import sampleCollection from '@components/Carousel/client/__fixtures__/collection.fixture'

const createAnimationControllerMock = vi.fn(() => ({
  requestPlay: vi.fn(),
  requestPause: vi.fn(),
  clearUserPreference: vi.fn(),
  destroy: vi.fn(),
}))

vi.mock('@components/scripts/store', () => ({
  createAnimationController: createAnimationControllerMock,
}))

type CarouselComponentModule = WebComponentModule<CarouselElement>
type ConcreteCarouselProps = Required<CarouselProps<'articles'>>

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async () => sampleCollection),
}))

vi.mock('embla-carousel', () => {
  const createEmbla = vi.fn(() => ({
    canScrollPrev: vi.fn(() => false),
    canScrollNext: vi.fn(() => false),
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    on: vi.fn(() => createEmbla.mock.results.at(-1)?.value ?? {}),
    off: vi.fn(() => createEmbla.mock.results.at(-1)?.value ?? {}),
    destroy: vi.fn(),
    scrollSnapList: vi.fn(() => [0, 1, 2]),
    selectedScrollSnap: vi.fn(() => 0),
    scrollTo: vi.fn(),
  }))

  return {
    default: createEmbla,
  }
})

vi.mock('embla-carousel-autoplay', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    play: vi.fn(),
    stop: vi.fn(),
  })),
}))

const defaultCarouselProps: ConcreteCarouselProps = {
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
  props: Partial<ConcreteCarouselProps> = {},
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
  })

  it('renders the provided title and respects the requested limit', async () => {
    await renderCarousel(({ root }) => {
      const heading = root.querySelector('h2')
      const slides = root.querySelectorAll('[data-carousel-slide]')

      expect(heading?.textContent).toBe('Latest Reads')
      expect(slides).toHaveLength(2)
    }, { title: 'Latest Reads', limit: 2, currentSlug: 'article-four' })
  })

  it('excludes the current slug from rendered cards', async () => {
    await renderCarousel(({ root }) => {
      const links = Array.from(root.querySelectorAll('a[href^="/articles/"]'))
      const hrefs = links.map(link => link.getAttribute('href'))

      expect(hrefs).not.toContain('/articles/article-one')
    }, { currentSlug: 'article-one' })
  })

  it('renders featured items with icons when available', async () => {
    await renderCarousel(({ root }) => {
      const cardWithIcon = root.querySelector('[data-carousel-slide] img')

      expect(cardWithIcon).toBeTruthy()
      expect(cardWithIcon?.getAttribute('src')).toBe('/icons/one.svg')
    })
  })

  it('orders suggested items by publish date when variant is suggested', async () => {
    await renderCarousel(({ root }) => {
      const cardTitles = Array.from(root.querySelectorAll('[data-carousel-slide] h3')).map(title =>
        title.textContent?.trim(),
      )

      expect(cardTitles[0]).toBe('Article Four')
      expect(cardTitles[1]).toBe('Article Three')
    }, { variant: 'suggested', limit: 3 })
  })

  it('renders randomized order when variant is random', async () => {
    await renderCarousel(({ root }) => {
      const cardTitles = Array.from(root.querySelectorAll('[data-carousel-slide] h3')).map(title =>
        title.textContent?.trim(),
      )

      expect(cardTitles).toHaveLength(3)
      expect(new Set(cardTitles)).toEqual(new Set(['Article Four', 'Article Three', 'Article One']))
    }, { variant: 'random', limit: 3 })
  })

  it('registers an animation lifecycle controller', async () => {
    await renderCarousel(() => {
      expect(createAnimationControllerMock).toHaveBeenCalled()
    })
  })
})
