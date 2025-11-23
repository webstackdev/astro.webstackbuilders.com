// @vitest-environment node

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { Window } from 'happy-dom'
import CarouselComponent from '@components/Carousel/index.astro'

type CarouselProps = {
  title?: string
  limit?: number
  variant?: 'featured' | 'suggested' | 'random'
  currentSlug?: string
  type?: 'services' | 'case-studies' | 'articles'
}

const sampleCollection = [
  {
    id: 'article-one',
    data: {
      title: 'Article One',
      description: 'First test entry',
      publishDate: '2024-01-01',
      featured: true,
      icon: '/icons/one.svg',
    },
  },
  {
    id: 'article-two',
    data: {
      title: 'Article Two',
      description: 'Second test entry',
      publishDate: '2024-02-01',
      featured: true,
    },
  },
  {
    id: 'article-three',
    data: {
      title: 'Article Three',
      description: 'Third test entry',
      publishDate: '2024-03-01',
      featured: false,
    },
  },
  {
    id: 'article-four',
    data: {
      title: 'Article Four',
      description: 'Fourth test entry',
      publishDate: '2024-04-01',
      featured: false,
    },
  },
]

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async () => sampleCollection),
}))

const baseProps: Required<CarouselProps> = {
  title: 'Featured Articles',
  limit: 3,
  variant: 'featured',
  currentSlug: 'article-two',
  type: 'articles',
}

const renderCarousel = async (props?: Partial<CarouselProps>) => {
  const container = await AstroContainer.create()
  const html = await container.renderToString(CarouselComponent, {
    props: { ...baseProps, ...props },
  })

  const window = new Window()
  const domParser = new window.DOMParser()
  const document = domParser.parseFromString(html, 'text/html')

  return { html, document }
}

describe('Carousel component (server output)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the provided title and respects the requested limit', async () => {
    const { document } = await renderCarousel({ title: 'Latest Reads', limit: 2, currentSlug: 'article-four' })

    const heading = document.querySelector('h2')
    const slides = document.querySelectorAll('[data-carousel-slide]')

    expect(heading?.textContent).toBe('Latest Reads')
    expect(slides).toHaveLength(2)
  })

  it('excludes the current slug from rendered cards', async () => {
    const { document } = await renderCarousel({ currentSlug: 'article-one' })
    const links = Array.from(document.querySelectorAll('a[href^="/articles/"]'))
    const hrefs = links.map(link => link.getAttribute('href'))

    expect(hrefs).not.toContain('/articles/article-one')
  })

  it('renders featured items with icons when available', async () => {
    const { document } = await renderCarousel()
    const cardWithIcon = document.querySelector('[data-carousel-slide] img')

    expect(cardWithIcon).toBeTruthy()
    expect(cardWithIcon?.getAttribute('src')).toBe('/icons/one.svg')
  })

  it('orders suggested items by publish date when variant is suggested', async () => {
    const { document } = await renderCarousel({ variant: 'suggested', limit: 3 })
    const cardTitles = Array.from(document.querySelectorAll('[data-carousel-slide] h3')).map(title =>
      title.textContent?.trim(),
    )

    expect(cardTitles[0]).toBe('Article Four')
    expect(cardTitles[1]).toBe('Article Three')
  })

  it('renders randomized order when variant is random', async () => {
    const { document } = await renderCarousel({ variant: 'random', limit: 3 })
    const cardTitles = Array.from(document.querySelectorAll('[data-carousel-slide] h3')).map(title =>
      title.textContent?.trim(),
    )

    expect(cardTitles).toHaveLength(3)
    expect(new Set(cardTitles)).toEqual(new Set(['Article Four', 'Article Three', 'Article One']))
  })
})
