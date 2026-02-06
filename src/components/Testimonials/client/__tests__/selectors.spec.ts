import { beforeEach, describe, expect, it, vi } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Testimonials from '@components/Testimonials/index.astro'
import type { TestimonialsProps } from '@components/Testimonials/props'
import type { TestimonialsCarouselElement as TestimonialsCarouselElementInstance } from '../index'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import { executeRender } from '@test/unit/helpers/litRuntime'
import testimonialsCollection from '@components/Testimonials/client/__fixtures__/collection.fixture'
import {
  getTestimonialsEmblaSetupElements,
  queryTestimonialsAutoplayPauseIcon,
  queryTestimonialsAutoplayPlayIcon,
  queryTestimonialsAutoplayToggleBtn,
  queryTestimonialsDotsContainer,
  queryTestimonialsNextBtn,
  queryTestimonialsPrevBtn,
  queryTestimonialsSlides,
} from '../selectors'

type TestimonialsModule = WebComponentModule<TestimonialsCarouselElementInstance>

vi.mock('@components/scripts/store', () => ({
  createAnimationController: vi.fn(() => ({
    requestPlay: vi.fn(),
    requestPause: vi.fn(),
    setInstancePauseState: vi.fn(),
    clearUserPreference: vi.fn(),
    destroy: vi.fn(),
  })),
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
  default: vi.fn(() => ({ play: vi.fn(), stop: vi.fn() })),
}))

vi.mock('astro:content', () => ({
  getCollection: vi.fn(async () => testimonialsCollection),
}))

describe('Testimonials selectors', () => {
  let container: AstroContainer

  beforeEach(async () => {
    container = await AstroContainer.create()
  })

  it('stays in sync with the Testimonials layout', async () => {
    const props: Partial<TestimonialsProps> = {
      title: 'Trusted Partners',
      limit: 2,
    }

    await executeRender<TestimonialsModule>({
      container,
      component: Testimonials,
      moduleSpecifier: '@components/Testimonials/client/index',
      args: { props },
      assert: async ({ element }) => {
        const { emblaRoot, viewport } = getTestimonialsEmblaSetupElements(element)
        const slides = queryTestimonialsSlides(element)
        const dots = queryTestimonialsDotsContainer(element)
        const prevBtn = queryTestimonialsPrevBtn(element)
        const nextBtn = queryTestimonialsNextBtn(element)
        const autoplayToggle = queryTestimonialsAutoplayToggleBtn(element)

        expect(
          emblaRoot,
          'Testimonials should render an Embla root with .testimonials-embla'
        ).toBeInstanceOf(HTMLElement)
        expect(
          viewport,
          'Testimonials should render an Embla viewport with .embla__viewport'
        ).toBeInstanceOf(HTMLElement)
        expect(
          slides.length,
          'Testimonials should render at least one slide with .embla__slide'
        ).toBeGreaterThan(0)

        expect(
          dots,
          'Testimonials should render a dots container with .embla__dots when >1 slide'
        ).toBeInstanceOf(HTMLElement)
        expect(
          prevBtn,
          'Testimonials should render a prev button with .embla__button--prev when >1 slide'
        ).toBeInstanceOf(HTMLButtonElement)
        expect(
          nextBtn,
          'Testimonials should render a next button with .embla__button--next when >1 slide'
        ).toBeInstanceOf(HTMLButtonElement)
        expect(
          autoplayToggle,
          'Testimonials should render an autoplay toggle button with [data-testimonials-autoplay-toggle] when >1 slide'
        ).toBeInstanceOf(HTMLButtonElement)

        if (autoplayToggle) {
          const pauseIcon = queryTestimonialsAutoplayPauseIcon(autoplayToggle)
          const playIcon = queryTestimonialsAutoplayPlayIcon(autoplayToggle)

          expect(
            pauseIcon,
            'Autoplay toggle should include [data-testimonials-icon="pause"]'
          ).toBeTruthy()
          expect(
            playIcon,
            'Autoplay toggle should include [data-testimonials-icon="play"]'
          ).toBeTruthy()
        }
      },
    })
  })
})
