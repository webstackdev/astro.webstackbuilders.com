/**
 * Event handlers for the cookie customize modal
 */
import { isDivElement, isButtonElement } from "@lib/utils/assertions/elements"
import { ClientScriptError } from "@components/Scripts/errors/ClientScriptError"
import { addButtonEventListeners } from "@lib/utils/elementListeners"

/** Gets the HTMLDivElement wrapping the cookie customize modal */
export const getCookieCustomizeModal = () => {
  const modal = document.getElementById('cookie-customize-modal-id')
  if (!isDivElement(modal)) {
    throw new ClientScriptError(`Cookie customize modal with id 'cookie-customize-modal-id' not found`)
  }
  return modal
}

/** Gets the close button for the cookie customize modal */
export const getCookieCustomizeCloseBtn = () => {
  const closeBtn = document.querySelector('.cookie-modal__close-btn')
  if (!isButtonElement(closeBtn)) {
    throw new ClientScriptError(`Cookie customize close button with class 'cookie-modal__close-btn' not found`)
  }
  return closeBtn
}

/** Show the cookie customize modal */
export const showCookieCustomizeModal = () => {
  const modal = getCookieCustomizeModal()
  modal.style.display = 'flex'

  // Add event listener for close button
  const closeBtn = getCookieCustomizeCloseBtn()
  addButtonEventListeners(closeBtn, handleCloseCookieCustomizeModal)
}

/** Hide the cookie customize modal */
export const handleCloseCookieCustomizeModal = () => {
  const modal = getCookieCustomizeModal()
  modal.style.display = 'none'
}
