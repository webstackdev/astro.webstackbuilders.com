/**
 * Type-safe HTML element selectors for the layout position store.
 *
 * These selectors are used by the layout measurement functions to find
 * the ThemePicker modal, the fixed header, and the progress bar.
 */

export const LAYOUT_SELECTORS = {
  themePickerModal: '[data-theme-modal]',
  headerFixed: '.header-fixed',
  progressBar: '[data-progress-bar]',
} as const

/**
 * Query the ThemePicker modal element.
 */
export function getThemePickerModalElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>(LAYOUT_SELECTORS.themePickerModal)
}

/**
 * Query the fixed header wrapper element.
 */
export function getHeaderFixedElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>(LAYOUT_SELECTORS.headerFixed)
}

/**
 * Query the progress bar element.
 */
export function getProgressBarElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>(LAYOUT_SELECTORS.progressBar)
}
