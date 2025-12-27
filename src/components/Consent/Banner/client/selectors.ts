/**
 * Selectors for the consent modal elements
 */
import {
  isAnchorElement,
  isButtonElement,
  isDivElement,
} from '@components/scripts/assertions/elements'
import { ClientScriptError } from '@components/scripts/errors'

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

export const getConsentCustomizeLink = () => {
  const customizeLink = document.querySelector('.consent-modal__btn-customize')
  if (!isAnchorElement(customizeLink)) {
    throw new ClientScriptError(
      `Cookie consent 'Customize' link with class 'consent-modal__btn-customize' not found`
    )
  }
  return customizeLink
}

export const queryConsentFocusableElements = (scope: ParentNode): HTMLElement[] => {
  const focusableElements = scope.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
  )

  return Array.from(focusableElements).filter(
    (node): node is HTMLElement => node instanceof HTMLElement
  )
}
