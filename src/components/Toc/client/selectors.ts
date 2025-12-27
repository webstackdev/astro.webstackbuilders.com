import {
  isAnchorElement,
  isButtonElement,
  isDivElement,
} from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

export const SELECTORS = {
  toggleButton: '[data-toc-toggle]',
  overlay: '[data-toc-overlay]',
  panel: '[data-toc-panel]',
  link: '[data-toc-link]',
} as const

/**
 * Get table of contents elements with type validation
 */
export function getTableOfContentsElements(context: Element) {
  const toggleButton = context.querySelector(SELECTORS.toggleButton)
  if (!isButtonElement(toggleButton)) {
    throw new ClientScriptError({
      scriptName: 'TableOfContentsElement',
      operation: 'getTableOfContentsElements',
      message: 'ToC toggle button element not found',
    })
  }

  const overlay = context.querySelector(SELECTORS.overlay)
  if (!isButtonElement(overlay)) {
    throw new ClientScriptError({
      scriptName: 'TableOfContentsElement',
      operation: 'getTableOfContentsElements',
      message: 'ToC overlay element not found',
    })
  }

  const panel = context.querySelector(SELECTORS.panel)
  if (!isDivElement(panel)) {
    throw new ClientScriptError({
      scriptName: 'TableOfContentsElement',
      operation: 'getTableOfContentsElements',
      message: 'ToC panel element not found',
    })
  }

  const linkElements = Array.from(context.querySelectorAll(SELECTORS.link))
  const tocLinks = linkElements.filter(isAnchorElement)
  if (tocLinks.length !== linkElements.length) {
    throw new ClientScriptError({
      scriptName: 'TableOfContentsElement',
      operation: 'getTableOfContentsElements',
      message: 'Some ToC link elements are not anchor elements',
    })
  }

  return {
    toggleButton,
    overlay,
    panel,
    tocLinks,
  }
}
