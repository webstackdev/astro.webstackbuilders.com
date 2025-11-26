// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TestimonialsComponent from '@components/Testimonials/index.astro'
import type { TestimonialsProps } from '@components/Testimonials/props'
import type { TestimonialsCarouselElement } from '@components/Testimonials/client'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import testimonialsCollection from '@components/Testimonials/client/__fixtures__/collection.fixture'

const createAnimationControllerMock = vi.fn(() => ({
  requestPlay: vi.fn(),
  requestPause: vi.fn(),
  clearUserPreference: vi.fn(),
  destroy: vi.fn(),
}))

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
  default: vi.fn(() => ({
    play: vi.fn(),
    stop: vi.fn(),
  })),
}))

const defaultProps: TestimonialsProps = {
  title: 'Client Praise',
}

const renderTestimonials = async (
  assertion: (_context: { root: TestimonialsCarouselElement }) => Promise<void> | void,
  props: Partial<TestimonialsProps> = {},
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
  })

  it('renders the supplied title and respects the limit', async () => {
    await renderTestimonials(({ root }) => {
      const heading = root.querySelector('h2')
      const slides = root.querySelectorAll('.embla__slide')

      expect(heading?.textContent).toBe('Trusted Partners')
      expect(slides).toHaveLength(2)
    }, { title: 'Trusted Partners', limit: 2 })
  })

  it('omits navigation controls when only one testimonial is present', async () => {
    await renderTestimonials(({ root }) => {
      expect(root.querySelector('.embla__button--prev')).toBeNull()
      expect(root.querySelector('.embla__dots')).toBeNull()
    }, { limit: 1 })
  })

  it('registers the web component and generates pagination dots', async () => {
    await renderTestimonials(({ root }) => {
      const dots = root.querySelectorAll('.embla__dot')

      expect(root.getAttribute('data-carousel-ready')).toBe('true')
      expect(root.getAttribute('data-carousel-autoplay')).toBe('paused')
      expect(dots.length).toBeGreaterThan(0)
    })
  })

  it('registers an animation lifecycle controller', async () => {
    await renderTestimonials(() => {
      expect(createAnimationControllerMock).toHaveBeenCalled()
    })
  })
})
