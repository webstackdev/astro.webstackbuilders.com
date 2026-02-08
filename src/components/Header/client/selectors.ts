/**
 * Type-safe HTML element selectors for the Header component.
 */
import { ClientScriptError } from '@components/scripts/errors'
import { isDivElement, isHeaderElement } from '@components/scripts/assertions/elements'

export const SELECTORS = {
  /** Header shell wrapper */
  headerShell: '.header-shell',
  /** Site header element */
  header: '#header',
}

/**
 * Getter for the header shell wrapper element.
 */
export const getHeaderShellElement = (scope: ParentNode = document): HTMLDivElement => {
  const headerShell = scope.querySelector(SELECTORS.headerShell)
  if (!isDivElement(headerShell)) {
    throw new ClientScriptError({
      message: `Header shell element missing, selector: ${SELECTORS.headerShell}`,
    })
  }
  return headerShell
}

/**
 * Getter for the main header element.
 */
export const getHeaderElement = (scope: ParentNode = document): HTMLElement => {
  const header = scope.querySelector(SELECTORS.header)
  if (!isHeaderElement(header)) {
    throw new ClientScriptError({
      message: `Header element missing, selector: ${SELECTORS.header}`,
    })
  }
  return header
}
