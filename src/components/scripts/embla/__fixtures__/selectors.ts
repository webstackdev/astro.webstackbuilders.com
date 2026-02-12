import {
  isButtonElement,
  isDivElement,
} from '@components/scripts/assertions/elements'
import type { EmblaRootElement } from '../types'

const SELECTORS = {
  emblaRoot: '[data-embla-root]',
  viewport: '[data-embla-viewport]',
  dots: '[data-embla-dots]',
  prevBtn: '[data-embla-prev]',
  nextBtn: '[data-embla-next]',
  slide: '[data-embla-slide]',
} as const

export const queryEmblaRoot = (scope: ParentNode): EmblaRootElement | null => {
  const element = scope.querySelector(SELECTORS.emblaRoot)
  return isDivElement(element) ? (element as EmblaRootElement) : null
}

export const queryEmblaViewport = (scope: ParentNode): HTMLDivElement | null => {
  const element = scope.querySelector(SELECTORS.viewport)
  return isDivElement(element) ? element : null
}

export const queryEmblaDotsContainer = (scope: ParentNode): HTMLDivElement | null => {
  const element = scope.querySelector(SELECTORS.dots)
  return isDivElement(element) ? element : null
}

export const queryEmblaPrevButton = (scope: ParentNode): HTMLButtonElement | null => {
  const element = scope.querySelector(SELECTORS.prevBtn)
  return isButtonElement(element) ? element : null
}

export const queryEmblaNextButton = (scope: ParentNode): HTMLButtonElement | null => {
  const element = scope.querySelector(SELECTORS.nextBtn)
  return isButtonElement(element) ? element : null
}

export const queryEmblaSlides = (scope: ParentNode): HTMLDivElement[] => {
  return Array.from(scope.querySelectorAll(SELECTORS.slide)).filter(isDivElement)
}