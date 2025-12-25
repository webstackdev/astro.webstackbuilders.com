import { isButtonElement, isType1Element } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

type EmblaRootElement = HTMLElement & { __emblaApi__?: unknown }

export const SELECTORS = {
  emblaRoot: '.testimonials-embla',
  viewport: '.embla__viewport',
  slides: '.embla__slide',
  dotsContainer: '.embla__dots',
  prevBtn: '.embla__button--prev',
  nextBtn: '.embla__button--next',
  autoplayToggleBtn: '[data-testimonials-autoplay-toggle]',
  autoplayPauseIcon: '[data-testimonials-icon="pause"]',
  autoplayPlayIcon: '[data-testimonials-icon="play"]',
} as const

const isHtmlElement = (element: unknown): element is HTMLElement =>
  isType1Element(element) && element instanceof HTMLElement

export const queryTestimonialsEmblaRoot = (scope: ParentNode): EmblaRootElement | null => {
  const root = scope.querySelector(SELECTORS.emblaRoot)
  if (!isHtmlElement(root)) {
    return null
  }

  return root as EmblaRootElement
}

export const queryTestimonialsViewport = (scope: ParentNode): HTMLElement | null => {
  const viewport = scope.querySelector(SELECTORS.viewport)
  if (!isHtmlElement(viewport)) {
    return null
  }

  return viewport
}

export const queryTestimonialsDotsContainer = (scope: ParentNode): HTMLElement | null => {
  const dots = scope.querySelector(SELECTORS.dotsContainer)
  if (!isHtmlElement(dots)) {
    return null
  }

  return dots
}

export const queryTestimonialsPrevBtn = (scope: ParentNode): HTMLButtonElement | null => {
  const button = scope.querySelector(SELECTORS.prevBtn)
  if (!isButtonElement(button)) {
    return null
  }

  return button
}

export const queryTestimonialsNextBtn = (scope: ParentNode): HTMLButtonElement | null => {
  const button = scope.querySelector(SELECTORS.nextBtn)
  if (!isButtonElement(button)) {
    return null
  }

  return button
}

export const queryTestimonialsAutoplayToggleBtn = (scope: ParentNode): HTMLButtonElement | null => {
  const button = scope.querySelector(SELECTORS.autoplayToggleBtn)
  if (!isButtonElement(button)) {
    return null
  }

  return button
}

export const queryTestimonialsSlides = (scope: ParentNode): Element[] => Array.from(scope.querySelectorAll(SELECTORS.slides))

export const queryTestimonialsAutoplayPauseIcon = (toggleBtn: ParentNode): Element | null =>
  toggleBtn.querySelector(SELECTORS.autoplayPauseIcon)

export const queryTestimonialsAutoplayPlayIcon = (toggleBtn: ParentNode): Element | null =>
  toggleBtn.querySelector(SELECTORS.autoplayPlayIcon)

/**
 * Required DOM nodes needed to initialize Embla.
 */
export const getTestimonialsEmblaSetupElements = (scope: ParentNode) => {
  const emblaRoot = queryTestimonialsEmblaRoot(scope)
  const viewport = queryTestimonialsViewport(scope)

  if (!emblaRoot || !viewport) {
    throw new ClientScriptError('TestimonialsCarouselElement: Missing DOM nodes for Embla setup')
  }

  return { emblaRoot, viewport }
}
