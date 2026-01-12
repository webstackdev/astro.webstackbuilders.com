import { isType1Element } from '@components/scripts/assertions/elements'

const SELECTORS = {
  readyText: '[data-hero-ready-text]',
} as const

function isSpanElement(element: unknown): element is HTMLSpanElement {
  return isType1Element(element) && element.tagName === 'SPAN'
}

export function queryHeroReadyTextElement(scope: ParentNode): HTMLSpanElement | null {
  const element = scope.querySelector(SELECTORS.readyText)
  if (!element) return null
  return isSpanElement(element) ? element : null
}
