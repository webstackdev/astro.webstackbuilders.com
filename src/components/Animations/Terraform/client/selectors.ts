import { isButtonElement } from '@components/scripts/assertions/elements'

const SELECTORS = {
  toggleButton: '[data-animation-toggle]',
  pauseIcon: '[data-animation-icon="pause"]',
  playIcon: '[data-animation-icon="play"]',
} as const

export function queryAnimationToggleButton(scope: ParentNode): HTMLButtonElement | null {
  const button = scope.querySelector(SELECTORS.toggleButton)
  if (!button) return null
  return isButtonElement(button) ? button : null
}

export function queryAnimationTogglePauseIcon(scope: ParentNode): Element | null {
  return scope.querySelector(SELECTORS.pauseIcon)
}

export function queryAnimationTogglePlayIcon(scope: ParentNode): Element | null {
  return scope.querySelector(SELECTORS.playIcon)
}

/**
 * Query a primary edge `<path>` by its ID within the given scope.
 * Returns the element cast to `SVGPathElement` so callers can use `getTotalLength()`.
 */
export function queryEdgePath(scope: ParentNode, id: string): SVGPathElement | null {
  return scope.querySelector<SVGPathElement>(`#${id}`)
}
