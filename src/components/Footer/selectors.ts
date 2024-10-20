/**
 * Type-safe HTML element selectors
 */
import { isAnchorElement } from '../../utils/assertions/elements'

export const SELECTORS = {
  /** "Hire Me" block with current month and year set by script */
  hireMeAnchor: '#page-footer__hire-me-anchor',
}

/**
 * Getter for the header <span> HTML element that wraps the menu
 */
export const getHireMeAnchorElement = (): HTMLAnchorElement => {
  const anchor = document.querySelector(SELECTORS.hireMeAnchor)
  if (!isAnchorElement(anchor)) {
    throw new Error(`Footer anchor for "Hire Me" element, selector: ${SELECTORS.hireMeAnchor}`)
  }
  return anchor
}
