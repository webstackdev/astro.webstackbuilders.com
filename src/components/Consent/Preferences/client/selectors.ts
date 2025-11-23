/**
 * Type-safe HTML element selectors for Consent Preferences
 */
import { isDivElement, isButtonElement } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

export const SELECTORS = {
  /** Consent customize modal wrapper */
  modal: 'consent-modal-modal-id',
  /** Close button for modal */
  closeBtn: '[data-testid="consent-preferences-close"]',
  /** Allow all consent button */
  allowAllBtn: 'consent-allow-all',
  /** Save preferences button */
  saveBtn: 'consent-save-preferences',
}

/**
 * Getter for the consent customize modal <div> element
 */
export const getConsentCustomizeModal = (): HTMLDivElement => {
  const modal = document.getElementById(SELECTORS.modal)
  if (!isDivElement(modal)) {
    throw new ClientScriptError(
      `Consent customize modal with id '${SELECTORS.modal}' not found`
    )
  }
  return modal
}

/**
 * Getter for the consent customize close button
 */
export const getConsentCustomizeCloseBtn = (): HTMLButtonElement => {
  const closeBtn = document.querySelector(SELECTORS.closeBtn)
  if (!isButtonElement(closeBtn)) {
    throw new ClientScriptError(
      `Consent customize close button with selector '${SELECTORS.closeBtn}' not found`
    )
  }
  return closeBtn
}

/**
 * Getter for the allow all consent button
 */
export const getAllowAllBtn = (): HTMLButtonElement => {
  const allowAllBtn = document.getElementById(SELECTORS.allowAllBtn)
  if (!isButtonElement(allowAllBtn)) {
    throw new ClientScriptError('Allow all button not found or is not a button element')
  }
  return allowAllBtn
}

/**
 * Getter for the save preferences button
 */
export const getSavePreferencesBtn = (): HTMLButtonElement => {
  const saveBtn = document.getElementById(SELECTORS.saveBtn)
  if (!isButtonElement(saveBtn)) {
    throw new ClientScriptError('Save preferences button not found or is not a button element')
  }
  return saveBtn
}
