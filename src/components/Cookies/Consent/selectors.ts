/**
 * Selectors for the cookie consent modal elements
 */
import { isAnchorElement, isButtonElement, isDivElement } from '@components/Scripts/assertions/elements'
import { ClientScriptError } from '@components/Scripts/errors/ClientScriptError'

/** Gets the HTMLDivElement wrapping the cookie consent modal */
export const getCookieConsentWrapper = () => {
  const wrapper = document.getElementById('cookie-modal-id')
  if (!isDivElement(wrapper)) {
    throw new ClientScriptError(`Cookie consent modal wrapper with id 'cookie-modal-id' not found`)
  }
  return wrapper
}

export const getCookieConsentCloseBtn = () => {
  const closeBtn = document.querySelector('.cookie-modal__close-btn')
  if (!isButtonElement(closeBtn)) {
    throw new ClientScriptError(
      `Cookie consent close button with class 'cookie-modal__close-btn' not found`
    )
  }
  return closeBtn
}

export const getCookieConsentAllowLink = () => {
  const allowLink = document.querySelector('.cookie-modal__link-allow')
  if (!isButtonElement(allowLink)) {
    throw new ClientScriptError(
      `Cookie consent 'Allow All' link with class 'cookie-modal__link-allow' not found`
    )
  }
  return allowLink
}

export const getCookieConsentAllowBtn = () => {
  const allowBtn = document.querySelector('.cookie-modal__btn-allow')
  if (!isButtonElement(allowBtn)) {
    throw new ClientScriptError(
      `Cookie consent 'Allow All' button with class 'cookie-modal__btn-allow' not found`
    )
  }
  return allowBtn
}

export const getCookieConsentCustomizeLink = () => {
  const customizeLink = document.querySelector('.cookie-modal__link-customize')
  if (!isAnchorElement(customizeLink)) {
    throw new ClientScriptError(
      `Cookie consent 'Customize' link with class 'cookie-modal__link-customize' not found`
    )
  }
  return customizeLink
}

export const getCookieConsentCustomizeBtn = () => {
  const customizeBtn = document.querySelector('.cookie-modal__btn-customize')
  if (!isButtonElement(customizeBtn)) {
    throw new ClientScriptError(
      `Cookie consent 'Customize' button with class 'cookie-modal__btn-customize' not found`
    )
  }
  return customizeBtn
}