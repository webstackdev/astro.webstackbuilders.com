/**
 * Type guards for E2E testing
 */

/**
 * Type for HTML elements with test properties attached during persistence testing
 */
export interface ElementWithTestProperties extends HTMLElement {
  __testProperty?: string
  __navigationCounter?: number
}

/**
 * Type guard to check if an element has test properties attached
 */
export function isElementWithTestProperties(
  element: unknown
): element is ElementWithTestProperties {
  if (
    element &&
    typeof element === 'object' &&
    'nodeType' in (element as HTMLElement) &&
    (element as HTMLElement).nodeType === Node.ELEMENT_NODE
  ) {
    return true
  }
  return false
}
