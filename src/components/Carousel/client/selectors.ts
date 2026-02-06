import type { EmblaCarouselType } from 'embla-carousel'
import { isButtonElement, isType1Element } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

type CarouselEmblaRootElement = HTMLElement & { __emblaApi__?: EmblaCarouselType }

export const SELECTORS = {
  emblaRoot: '.embla',
  viewport: '.embla__viewport',
  dotsContainer: '.embla__dots',
  statusRegion: '[data-carousel-status]',
  prevBtn: '.embla__button--prev',
  nextBtn: '.embla__button--next',
  slides: '[data-carousel-slide]',
  focusVisibleSlide: '[data-carousel-slide] :focus-visible',
} as const

const isHtmlElement = (element: unknown): element is HTMLElement =>
  isType1Element(element) && element instanceof HTMLElement

export const queryCarouselEmblaRoot = (scope: ParentNode): CarouselEmblaRootElement | null => {
  const root = scope.querySelector(SELECTORS.emblaRoot)
  if (!isHtmlElement(root)) {
    return null
  }

  return root as CarouselEmblaRootElement
}

export const getCarouselEmblaRoot = (scope: ParentNode): CarouselEmblaRootElement => {
  const root = queryCarouselEmblaRoot(scope)
  if (!root) {
    throw new ClientScriptError(`CarouselElement: Missing required element: ${SELECTORS.emblaRoot}`)
  }

  return root
}

export const queryCarouselViewport = (scope: ParentNode): HTMLElement | null => {
  const viewport = scope.querySelector(SELECTORS.viewport)
  if (!isHtmlElement(viewport)) {
    return null
  }

  return viewport
}

export const getCarouselViewport = (scope: ParentNode): HTMLElement => {
  const viewport = queryCarouselViewport(scope)
  if (!viewport) {
    throw new ClientScriptError(`CarouselElement: Missing required element: ${SELECTORS.viewport}`)
  }

  return viewport
}

export const queryCarouselDotsContainer = (scope: ParentNode): HTMLElement | null => {
  const dotsContainer = scope.querySelector(SELECTORS.dotsContainer)
  if (!isHtmlElement(dotsContainer)) {
    return null
  }

  return dotsContainer
}

export const queryCarouselStatusRegion = (scope: ParentNode): HTMLElement | null => {
  const statusRegion = scope.querySelector(SELECTORS.statusRegion)
  if (!isHtmlElement(statusRegion)) {
    return null
  }

  return statusRegion
}

export const queryCarouselPrevBtn = (scope: ParentNode): HTMLButtonElement | null => {
  const button = scope.querySelector(SELECTORS.prevBtn)
  if (!isButtonElement(button)) {
    return null
  }

  return button
}

export const queryCarouselNextBtn = (scope: ParentNode): HTMLButtonElement | null => {
  const button = scope.querySelector(SELECTORS.nextBtn)
  if (!isButtonElement(button)) {
    return null
  }

  return button
}

export const queryCarouselSlides = (scope: ParentNode): Element[] =>
  Array.from(scope.querySelectorAll(SELECTORS.slides))

export const hasCarouselFocusVisibleSlide = (scope: ParentNode): boolean => {
  try {
    return scope.querySelector(SELECTORS.focusVisibleSlide) instanceof HTMLElement
  } catch {
    return false
  }
}

export type { CarouselEmblaRootElement }
