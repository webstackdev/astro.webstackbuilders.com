/**
 * Selectors for the theme picker elements
 */
import { isButtonElement, isDivElement } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

/**
 * Gets the theme picker modal element
 * @param scope - Element to query within (defaults to document)
 */
export const getThemePickerModal = (scope: ParentNode = document) => {
  const modal = scope.querySelector('[data-theme-modal]')
  if (!isDivElement(modal)) {
    throw new ClientScriptError(`Theme picker modal with selector '[data-theme-modal]' not found`)
  }
  return modal
}

/**
 * Gets the theme picker toggle button (in header)
 */
export const getThemePickerToggleBtn = () => {
  const toggleBtn = document.querySelector('[data-theme-toggle]')
  if (!isButtonElement(toggleBtn)) {
    throw new ClientScriptError(
      `Theme picker toggle button with selector '[data-theme-toggle]' not found`
    )
  }
  return toggleBtn
}

/**
 * Gets the theme picker close button
 * @param scope - Element to query within (defaults to document)
 */
export const getThemePickerCloseBtn = (scope: ParentNode = document) => {
  const closeBtn = scope.querySelector('[data-theme-close]')
  if (!isButtonElement(closeBtn)) {
    throw new ClientScriptError(
      `Theme picker close button with selector '[data-theme-close]' not found`
    )
  }
  return closeBtn
}

/**
 * Gets all theme selection buttons
 * @param scope - Element to query within (defaults to document)
 */
export const getThemeSelectBtns = (scope: ParentNode = document) => {
  const buttons = scope.querySelectorAll('[data-theme]')
  if (buttons.length === 0) {
    throw new ClientScriptError(`Theme selection buttons with selector '[data-theme]' not found`)
  }

  // Validate all buttons are actually button elements
  const buttonArray = Array.from(buttons)
  if (!buttonArray.every(isButtonElement)) {
    throw new ClientScriptError(`Some theme selection elements are not button elements`)
  }

  return buttons as NodeListOf<HTMLButtonElement>
}
