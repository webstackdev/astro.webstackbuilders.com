import { isType1Element } from '@components/scripts/assertions/elements'

export const SELECTORS = {
  canvas: '[data-confetti-canvas]',
} as const

/**
 * The confetti canvas is optional for this component's core contract. The logic
 * is explicitly best effort: if there's no [data-confetti-canvas], it just
 * doesn't create a per-canvas confetti instance and fire() becomes a no-op.
 */
export const queryConfettiCanvas = (scope: ParentNode): HTMLCanvasElement | null => {
  const canvas = scope.querySelector(SELECTORS.canvas)
  if (!isType1Element(canvas) || canvas.tagName !== 'CANVAS') {
    return null
  }

  return canvas as HTMLCanvasElement
}
