/**
 * Selectors for the consent modal elements
 */
import {
  isButtonElement,
  isDivElement,
} from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'

/** Gets the HTMLDivElement wrapping the consent modal */
export const getConsentWrapper = () => {
  const wrapper = document.getElementById('consent-modal-id')
  if (!isDivElement(wrapper)) {
    throw new ClientScriptError(`Cookie consent modal wrapper with id 'consent-modal-id' not found`)
  }
  return wrapper
}

export const getConsentCloseBtn = () => {
  const closeBtn = document.querySelector('.consent-modal__close-btn')
  if (!isButtonElement(closeBtn)) {
    throw new ClientScriptError(
      `Cookie consent close button with class 'consent-modal__close-btn' not found`
    )
  }
  return closeBtn
}

export const getConsentAllowBtn = () => {
  const allowBtn = document.querySelector('.consent-modal__btn-allow')
  if (!isButtonElement(allowBtn)) {
    throw new ClientScriptError(
      `Cookie consent 'Allow All' button with class 'consent-modal__btn-allow' not found`
    )
  }
  return allowBtn
}

export const getConsentCustomizeBtn = () => {
  const customizeBtn = document.querySelector('.consent-modal__btn-customize')
  if (!isButtonElement(customizeBtn)) {
    throw new ClientScriptError(
      `Cookie consent 'Customize' button with class 'consent-modal__btn-customize' not found`
    )
  }
  return customizeBtn
}
