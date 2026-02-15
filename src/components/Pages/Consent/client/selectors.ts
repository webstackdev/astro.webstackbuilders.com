/**
 * Type-safe HTML element selectors for Consent Preferences
 */
import { isButtonElement } from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

export const SELECTORS = {
  /** Allow all consent button */
  allowAllBtn: 'consent-allow-all',
  /** Deny all consent button */
  denyAllBtn: 'consent-deny-all',
  /** Save preferences button */
  saveBtn: 'consent-save-preferences',
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
 * Getter for the deny all consent button
 */
export const getDenyAllBtn = (): HTMLButtonElement => {
  const denyAllBtn = document.getElementById(SELECTORS.denyAllBtn)
  if (!isButtonElement(denyAllBtn)) {
    throw new ClientScriptError('Deny all button not found or is not a button element')
  }
  return denyAllBtn
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
