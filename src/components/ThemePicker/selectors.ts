/**
 * Type-safe HTML element selectors
 */
import {
  isButtonElement,
  isDivElement,
  isSpanElement
} from '@lib/utils/assertions/elements'

export const SELECTORS = {
  /** <span> wrapper for the theme picker toggle button */
  toggleWrapper: '#header__theme-icon',
  /** <button> element to toggle the picker in site <header> */
  toggleBtn: '.themepicker-toggle__toggle-btn',
  /** Wrapper <div> for the theme picker drop down component */
  pickerModal: '.themepicker',
  /** close <button> element for the theme picker drop down */
  closeBtn: '.themepicker__closeBtn',
  /** <button> element on each theme in drop down component to select that theme */
  themeSelectBtns: '.themepicker__selectBtn',
}

/**
 * Getter for the toggle <button> in the theme picker icon
 */
export const getThemePickerToggleWrapper = (): HTMLSpanElement => {
  const toggleWrapper = document.querySelector(SELECTORS.toggleWrapper)
  if (!isSpanElement(toggleWrapper))
    throw new Error(
      `Wrapper <span> element for the theme picker toggle button is missing in site HTML`
    )
  return toggleWrapper
}

/**
 * Getter for the toggle <button> in the theme picker icon
 */
export const getThemePickerToggleButton = (): HTMLButtonElement => {
  const toggleBtn = document.querySelector(SELECTORS.toggleBtn)
  if (!isButtonElement(toggleBtn))
    throw new Error(
      `Toggle <button> element with icon is missing in the theme picker modal wrapper`
    )
  return toggleBtn
}

/**
 * Getter for the theme picker drop down component wrapper <div>
 */
export const getThemePickerModalWrapper = (): HTMLDivElement => {
  const wrapper = document.querySelector(SELECTORS.pickerModal)
  if (!isDivElement(wrapper)) throw new Error(`Theme picker modal wrapper is missing in document`)
  return wrapper
}

/**
 * Getter for the close <button> for the theme picker modal
 */
export const getThemePickerCloseButton = (): HTMLButtonElement => {
  const closeBtn = document.querySelector(SELECTORS.closeBtn)
  if (!isButtonElement(closeBtn))
    throw new Error(`Close <button> element is missing in the theme picker modal wrapper`)
  return closeBtn
}

/**
 * Getter for the select <button> that wraps each theme item card
 */
export const getThemePickerSelectButtons = (): NodeListOf<HTMLButtonElement> => {
  const selectBtns = document.querySelectorAll(SELECTORS.themeSelectBtns)
  if (!selectBtns.length) throw new Error(`No theme item card select <button> elements found in theme picker modal`)
  selectBtns.forEach((button) => {
    if (!isButtonElement(button))
      throw new Error(`Theme select button class applied to non-button`)
  })

  return selectBtns as NodeListOf<HTMLButtonElement>
}
