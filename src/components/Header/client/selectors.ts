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

export const ANIMATION_SELECTORS = {
  siteHeader: '.site-header',
  brand: '.header-brand',
  footprint: '.header-footprint',
  icon: '.header-icon',
  navLink: '.header-nav a',
} as const

// ============================================================================
// HEADER ELEMENT GETTERS
// ============================================================================

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

// ============================================================================
// ANIMATION ELEMENT GETTERS
// ============================================================================

export interface AnimationElements {
  headerShell: HTMLElement
  siteHeader: HTMLElement
  brand: HTMLElement
  footprint: HTMLElement
  icons: HTMLElement[]
  navLinks: HTMLElement[]
}

/**
 * Query all animated elements from the header shell.
 * Returns null if required elements are missing (e.g. during SSR or testing).
 */
export function getAnimationElements(headerShell: HTMLElement): AnimationElements | null {
  const siteHeader = headerShell.querySelector<HTMLElement>(ANIMATION_SELECTORS.siteHeader)
  const brand = headerShell.querySelector<HTMLElement>(ANIMATION_SELECTORS.brand)
  const footprint = headerShell.querySelector<HTMLElement>(ANIMATION_SELECTORS.footprint)

  if (!siteHeader || !brand || !footprint) return null

  const icons = Array.from(headerShell.querySelectorAll<HTMLElement>(ANIMATION_SELECTORS.icon))
  const navLinks = Array.from(
    headerShell.querySelectorAll<HTMLElement>(ANIMATION_SELECTORS.navLink)
  )

  return { headerShell, siteHeader, brand, footprint, icons, navLinks }
}
