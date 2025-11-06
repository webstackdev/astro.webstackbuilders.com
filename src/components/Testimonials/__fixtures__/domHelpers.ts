/**
 * DOM utilities for testimonials component testing
 * Creates minimal DOM structure needed for testing testimonials carousel JavaScript behavior
 */

import { mockTestimonials, type TestimonialData } from '@components/Testimonials/__fixtures__/mockData'

/**
 * Generates a single testimonial card HTML
 */
function getTestimonialCardHTML(testimonial: TestimonialData): string {
  return `
    <div class="embla__slide flex-[0_0_100%] min-w-0 px-4">
      <article class="testimonial-card bg-[color:var(--color-bg)] rounded-xl shadow-lg p-8 h-full">
        <blockquote class="text-lg text-[color:var(--color-text)] mb-6 leading-relaxed">
          "${testimonial.content}"
        </blockquote>
        <div class="flex items-center gap-4">
          ${
            testimonial.avatar
              ? `
          <div class="w-12 h-12 rounded-full overflow-hidden bg-[color:var(--color-bg-offset)]">
            <img
              src="${testimonial.avatar}"
              alt="${testimonial.author}"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          `
              : ''
          }
          <div>
            <cite class="not-italic font-semibold text-[color:var(--color-text)]">
              ${testimonial.author}
            </cite>
            <div class="text-sm text-[color:var(--color-text-offset)]">
              ${testimonial.role}${testimonial.company ? ` at ${testimonial.company}` : ''}
            </div>
          </div>
        </div>
      </article>
    </div>
  `
}

/**
 * Generates the complete testimonials carousel HTML structure
 */
function getTestimonialsCarouselHTML(): string {
  const testimonialCards = mockTestimonials.map(getTestimonialCardHTML).join('')

  return `
    <section class="testimonials-embla overflow-hidden">
      <div class="embla__viewport">
        <div class="embla__container flex">
          ${testimonialCards}
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="embla__controls flex items-center justify-center gap-4 mt-8">
        <button
          class="embla__button embla__button--prev bg-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-offset)] text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200"
          type="button"
          aria-label="Previous testimonial"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>

        <!-- Dots Container -->
        <div class="embla__dots flex gap-2"></div>

        <button
          class="embla__button embla__button--next bg-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-offset)] text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200"
          type="button"
          aria-label="Next testimonial"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </section>
  `
}

/**
 * Setup DOM for testing testimonials carousel
 */
export function setupTestimonialsCarouselDOM(): void {
  document.body.innerHTML = getTestimonialsCarouselHTML()
}

/**
 * Clean up DOM after tests
 */
export function cleanupTestimonialsCarouselDOM(): void {
  document.body.innerHTML = ''
}

/**
 * Helper to get specific DOM elements for testing
 */
export const getDOMElements = () => ({
  container: document.querySelector<HTMLElement>('.testimonials-embla'),
  viewport: document.querySelector<HTMLElement>('.embla__viewport'),
  slides: document.querySelectorAll<HTMLElement>('.embla__slide'),
  prevButton: document.querySelector<HTMLButtonElement>('.embla__button--prev'),
  nextButton: document.querySelector<HTMLButtonElement>('.embla__button--next'),
  dotsContainer: document.querySelector<HTMLElement>('.embla__dots'),
})

/**
 * Helper to simulate user interactions
 */
export const userInteractions = {
  clickPrevButton: () => {
    const prevBtn = document.querySelector<HTMLButtonElement>('.embla__button--prev')
    if (prevBtn) {
      prevBtn.click()
    }
  },

  clickNextButton: () => {
    const nextBtn = document.querySelector<HTMLButtonElement>('.embla__button--next')
    if (nextBtn) {
      nextBtn.click()
    }
  },

  clickDot: (index: number) => {
    const dots = document.querySelectorAll<HTMLButtonElement>('.embla__dot')
    if (dots[index]) {
      dots[index].click()
    }
  },
}
