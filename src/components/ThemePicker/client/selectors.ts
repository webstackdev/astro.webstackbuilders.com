/**
 * Selectors for the theme picker elements
 */
import { isButtonElement, isDivElement, isMetaElement } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

export const SELECTORS = {
  modal: '[data-theme-modal]',
  toggleBtn: '[data-theme-toggle]',
  closeBtn: '[data-theme-close]',
  themeBtn: '[data-theme]',
  emblaViewport: '[data-theme-embla-viewport]',
  emblaPrevBtn: '[data-theme-embla-prev]',
  emblaNextBtn: '[data-theme-embla-next]',
  metaThemeColor: 'meta[name="theme-color"]',
} as const

/**
 * Gets the theme picker modal element
 * @param scope - Element to query within (defaults to document)
 */
export const getThemePickerModal = (scope: ParentNode = document) => {
  const modal = scope.querySelector(SELECTORS.modal)
  if (!isDivElement(modal)) {
    throw new ClientScriptError(`Theme picker modal with selector '${SELECTORS.modal}' not found`)
  }
  return modal
}

/**
 * Gets the theme picker toggle button (in header)
 */
export const getThemePickerToggleBtn = () => {
  const toggleBtn = document.querySelector(SELECTORS.toggleBtn)
  if (!isButtonElement(toggleBtn)) {
    throw new ClientScriptError(
      `Theme picker toggle button with selector '${SELECTORS.toggleBtn}' not found`
    )
  }
  return toggleBtn
}

/**
 * Gets the theme picker close button
 * @param scope - Element to query within (defaults to document)
 */
export const getThemePickerCloseBtn = (scope: ParentNode = document) => {
  const closeBtn = scope.querySelector(SELECTORS.closeBtn)
  if (!isButtonElement(closeBtn)) {
    throw new ClientScriptError(
      `Theme picker close button with selector '${SELECTORS.closeBtn}' not found`
    )
  }
  return closeBtn
}

/**
 * Gets all theme selection buttons
 * @param scope - Element to query within (defaults to document)
 */
export const getThemeSelectBtns = (scope: ParentNode = document) => {
  const buttons = scope.querySelectorAll(SELECTORS.themeBtn)
  if (buttons.length === 0) {
    throw new ClientScriptError(`Theme selection buttons with selector '${SELECTORS.themeBtn}' not found`)
  }

  // Validate all buttons are actually button elements
  const buttonArray = Array.from(buttons)
  if (!buttonArray.every(isButtonElement)) {
    throw new ClientScriptError(`Some theme selection elements are not button elements`)
  }

  return buttons as NodeListOf<HTMLButtonElement>
}

/**
 * Returns the Embla viewport element inside the theme picker.
 * Returns null when not present so theme picker can still function without Embla.
 */
export const queryThemePickerEmblaViewport = (scope: ParentNode = document): HTMLDivElement | null => {
  const viewport = scope.querySelector(SELECTORS.emblaViewport)
  if (!viewport) {
    return null
  }

  if (!isDivElement(viewport)) {
    return null
  }

  return viewport
}

/**
 * Returns the Embla previous button element inside the theme picker.
 * Returns null when not present.
 */
export const queryThemePickerEmblaPrevBtn = (scope: ParentNode = document): HTMLButtonElement | null => {
  const button = scope.querySelector(SELECTORS.emblaPrevBtn)
  if (!button) {
    return null
  }

  if (!isButtonElement(button)) {
    return null
  }

  return button
}

/**
 * Returns the Embla next button element inside the theme picker.
 * Returns null when not present.
 */
export const queryThemePickerEmblaNextBtn = (scope: ParentNode = document): HTMLButtonElement | null => {
  const button = scope.querySelector(SELECTORS.emblaNextBtn)
  if (!button) {
    return null
  }

  if (!isButtonElement(button)) {
    return null
  }

  return button
}

/**
 * Returns the meta theme-color element if present.
 */
export const queryMetaThemeColor = (scope: ParentNode = document): HTMLMetaElement | null => {
  const meta = scope.querySelector(SELECTORS.metaThemeColor)
  if (!isMetaElement(meta)) {
    return null
  }

  return meta
}
