import type { EmblaCarouselType } from 'embla-carousel'
import {
  isButtonElement,
  isDivElement,
  isType1Element,
} from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

type SkillsEmblaRootElement = HTMLElement & { __emblaApi__?: EmblaCarouselType }

const SELECTORS = {
  emblaRoot: '[data-skills-embla-root]',
  viewport: '[data-skills-embla-viewport]',
  slides: '[data-skills-slide]',
  prevBtn: '[data-skills-prev]',
  nextBtn: '[data-skills-next]',
  autoplayToggle: '[data-skills-autoplay-toggle]',
  autoplayPauseIcon: '[data-skills-icon="pause"]',
  autoplayPlayIcon: '[data-skills-icon="play"]',
} as const

const isHtmlElement = (element: unknown): element is HTMLElement =>
  isType1Element(element) && element instanceof HTMLElement

export const querySkillsEmblaRoot = (scope: ParentNode): SkillsEmblaRootElement | null => {
  const root = scope.querySelector(SELECTORS.emblaRoot)
  if (!isHtmlElement(root)) {
    return null
  }

  return root as SkillsEmblaRootElement
}

export const getSkillsEmblaRoot = (scope: ParentNode): SkillsEmblaRootElement => {
  const root = querySkillsEmblaRoot(scope)
  if (!root) {
    throw new ClientScriptError(`SkillsCarouselElement: Missing required element: ${SELECTORS.emblaRoot}`)
  }

  return root
}

export const querySkillsViewport = (scope: ParentNode): HTMLElement | null => {
  const viewport = scope.querySelector(SELECTORS.viewport)
  if (!isHtmlElement(viewport)) {
    return null
  }

  return viewport
}

export const getSkillsViewport = (scope: ParentNode): HTMLElement => {
  const viewport = querySkillsViewport(scope)
  if (!viewport) {
    throw new ClientScriptError(`SkillsCarouselElement: Missing required element: ${SELECTORS.viewport}`)
  }

  return viewport
}

export const querySkillsSlides = (scope: ParentNode): Element[] =>
  Array.from(scope.querySelectorAll(SELECTORS.slides))

export const querySkillsPrevBtn = (scope: ParentNode): HTMLButtonElement | null => {
  const button = scope.querySelector(SELECTORS.prevBtn)
  if (!isButtonElement(button)) {
    return null
  }

  return button
}

export const querySkillsNextBtn = (scope: ParentNode): HTMLButtonElement | null => {
  const button = scope.querySelector(SELECTORS.nextBtn)
  if (!isButtonElement(button)) {
    return null
  }

  return button
}

export const querySkillsAutoplayToggle = (scope: ParentNode): HTMLButtonElement | null => {
  const button = scope.querySelector(SELECTORS.autoplayToggle)
  if (!isButtonElement(button)) {
    return null
  }

  return button
}

export const querySkillsAutoplayPauseIcon = (scope: ParentNode): Element | null => {
  const icon = scope.querySelector(SELECTORS.autoplayPauseIcon)
  return isType1Element(icon) ? icon : null
}

export const querySkillsAutoplayPlayIcon = (scope: ParentNode): Element | null => {
  const icon = scope.querySelector(SELECTORS.autoplayPlayIcon)
  return isType1Element(icon) ? icon : null
}

export type { SkillsEmblaRootElement }