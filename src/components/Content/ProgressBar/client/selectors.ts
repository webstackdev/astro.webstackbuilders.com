/**
 * Type-safe HTML element selectors for the ReadingProgressBar component.
 */

export const SELECTORS = {
  /** The <progress> element inside the component */
  progress: 'progress',
  /** The #content region that the bar tracks scroll progress for */
  content: '#content',
} as const

/**
 * Query the <progress> element from within the component's light DOM.
 */
export function getProgressElement(scope: Element): HTMLProgressElement | null {
  return scope.querySelector<HTMLProgressElement>(SELECTORS.progress)
}

/**
 * Query the #content region from the document.
 */
export function getContentElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>(SELECTORS.content)
}
