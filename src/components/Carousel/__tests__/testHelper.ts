/**
 * Test helper utilities for setting up Services carousel DOM in tests
 * Creates minimal DOM structure needed for testing carousel JavaScript behavior
 */

interface ServiceData {
  id: string
  title: string
  description: string
  icon?: string
}

/**
 * Mock service data for testing
 */
const mockServices: ServiceData[] = [
  {
    id: 'service-1',
    title: 'Web Development',
    description: 'Build modern, responsive websites',
    icon: '/icons/web.svg',
  },
  {
    id: 'service-2',
    title: 'Mobile Apps',
    description: 'Create native mobile applications',
    icon: '/icons/mobile.svg',
  },
  {
    id: 'service-3',
    title: 'Cloud Solutions',
    description: 'Deploy scalable cloud infrastructure',
    icon: '/icons/cloud.svg',
  },
]

/**
 * Generates a single service card HTML
 */
function getServiceCardHTML(service: ServiceData): string {
  return `
    <div class="embla__slide flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0">
      <article class="group h-full">
        <a
          href="/services/${service.id}/"
          class="block h-full bg-[color:var(--color-bg)] rounded-xl shadow-lg"
        >
          ${service.icon ? `
          <div class="p-6 pb-4">
            <div class="w-12 h-12 bg-[color:var(--color-bg-offset)] rounded-lg flex items-center justify-center">
              <img
                src="${service.icon}"
                alt=""
                loading="lazy"
                class="w-6 h-6"
              />
            </div>
          </div>
          ` : ''}
          <div class="p-6 pt-2">
            <h3 class="text-xl font-semibold text-[color:var(--color-text)] mb-3">
              ${service.title}
            </h3>
            <p class="text-[color:var(--color-text-offset)] leading-relaxed text-sm">
              ${service.description}
            </p>
          </div>
        </a>
      </article>
    </div>
  `
}

/**
 * Generates the complete carousel HTML structure
 */
export function getCarouselHTML(services: ServiceData[] = mockServices): string {
  const slides = services.map(service => getServiceCardHTML(service)).join('')

  return `
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <header class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold text-[color:var(--color-text)]">Featured Services</h2>
      </header>

      <div class="embla relative">
        <div class="embla__viewport overflow-hidden">
          <div class="embla__container flex gap-4 md:gap-6">
            ${slides}
          </div>
        </div>

        <button
          type="button"
          class="embla__button embla__button--prev absolute left-0 top-1/2"
          aria-label="Previous slide"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>

        <button
          type="button"
          class="embla__button embla__button--next absolute right-0 top-1/2"
          aria-label="Next slide"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>

        <div class="embla__dots flex gap-2 justify-center mt-8" role="tablist" aria-label="Carousel navigation"></div>
      </div>
    </section>
  `
}

/**
 * Sets up the carousel DOM in document.body for testing
 */
export function setupCarouselDOM(services?: ServiceData[]): void {
  document.body.innerHTML = getCarouselHTML(services)
}

/**
 * Export mock services for use in tests
 */
export { mockServices }
