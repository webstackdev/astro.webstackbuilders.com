/**
 * Type-safe HTML element selectors for Mastodon Modal
 *
 * SPDX-FileCopyrightText: © 2025 Kevin Brown <kevin@webstackbuilders.com>
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
  isButtonElement,
  isDivElement,
  isFormElement,
  isInputElement,
} from '@components/Scripts/assertions/elements'

export const SELECTORS = {
  /** Main modal container */
  modal: '#mastodon-modal',
  /** Modal backdrop overlay */
  backdrop: '.modal-backdrop',
  /** Close button in modal header */
  closeButton: '.modal-close',
  /** Cancel button in modal footer */
  cancelButton: '.modal-cancel',
  /** Share form element */
  form: '#mastodon-share-form',
  /** Textarea for share text */
  shareText: '#share-text',
  /** Mastodon instance input field */
  instanceInput: '#mastodon-instance',
  /** Remember instance checkbox */
  rememberCheckbox: '#remember-instance',
  /** Submit button */
  submitButton: 'button[type="submit"]',
  /** Status message element */
  statusElement: '.modal-status',
  /** Saved instances container */
  savedInstancesContainer: '#saved-instances',
  /** Saved instances list */
  savedInstancesList: '.saved-list',
}

/**
 * Gets the modal container element
 */
export function getModalElement(): HTMLDivElement {
  const modal = document.querySelector(SELECTORS.modal)
  if (!isDivElement(modal)) {
    throw new Error('Mastodon modal container <div> is missing from the DOM')
  }
  return modal
}

/**
 * Gets the modal backdrop element
 */
export function getBackdropElement(modal: HTMLDivElement): HTMLDivElement {
  const backdrop = modal.querySelector(SELECTORS.backdrop)
  if (!isDivElement(backdrop)) {
    throw new Error('Modal backdrop <div> is missing from modal')
  }
  return backdrop
}

/**
 * Gets the close button element
 */
export function getCloseButtonElement(modal: HTMLDivElement): HTMLButtonElement {
  const button = modal.querySelector(SELECTORS.closeButton)
  if (!isButtonElement(button)) {
    throw new Error('Modal close <button> is missing from modal header')
  }
  return button
}

/**
 * Gets the cancel button element
 */
export function getCancelButtonElement(modal: HTMLDivElement): HTMLButtonElement {
  const button = modal.querySelector(SELECTORS.cancelButton)
  if (!isButtonElement(button)) {
    throw new Error('Modal cancel <button> is missing from modal actions')
  }
  return button
}

/**
 * Gets the form element
 */
export function getFormElement(modal: HTMLDivElement): HTMLFormElement {
  const form = modal.querySelector(SELECTORS.form)
  if (!isFormElement(form)) {
    throw new Error('Share <form> is missing from modal')
  }
  return form
}

/**
 * Gets the share text textarea element
 */
export function getShareTextElement(modal: HTMLDivElement): HTMLTextAreaElement {
  const textarea = modal.querySelector(SELECTORS.shareText)
  if (!(textarea instanceof HTMLTextAreaElement)) {
    throw new Error('Share text <textarea> is missing from form')
  }
  return textarea
}

/**
 * Gets the instance input element
 */
export function getInstanceInputElement(modal: HTMLDivElement): HTMLInputElement {
  const input = modal.querySelector(SELECTORS.instanceInput)
  if (!isInputElement(input)) {
    throw new Error('Instance <input> is missing from form')
  }
  return input
}

/**
 * Gets the remember checkbox element
 */
export function getRememberCheckboxElement(modal: HTMLDivElement): HTMLInputElement {
  const checkbox = modal.querySelector(SELECTORS.rememberCheckbox)
  if (!isInputElement(checkbox)) {
    throw new Error('Remember checkbox <input> is missing from form')
  }
  return checkbox
}

/**
 * Gets the submit button element
 */
export function getSubmitButtonElement(form: HTMLFormElement): HTMLButtonElement {
  const button = form.querySelector(SELECTORS.submitButton)
  if (!isButtonElement(button)) {
    throw new Error('Submit <button> is missing from form')
  }
  return button
}

/**
 * Gets the status message element
 */
export function getStatusElement(modal: HTMLDivElement): HTMLParagraphElement {
  const status = modal.querySelector(SELECTORS.statusElement)
  if (!(status instanceof HTMLParagraphElement)) {
    throw new Error('Status <p> element is missing from modal')
  }
  return status
}

/**
 * Gets the saved instances container element
 */
export function getSavedInstancesContainer(modal: HTMLDivElement): HTMLDivElement {
  const container = modal.querySelector(SELECTORS.savedInstancesContainer)
  if (!isDivElement(container)) {
    throw new Error('Saved instances container <div> is missing from modal')
  }
  return container
}

/**
 * Gets the saved instances list element
 */
export function getSavedInstancesList(modal: HTMLDivElement): HTMLDivElement {
  const list = modal.querySelector(SELECTORS.savedInstancesList)
  if (!isDivElement(list)) {
    throw new Error('Saved instances list <div> is missing from modal')
  }
  return list
}
