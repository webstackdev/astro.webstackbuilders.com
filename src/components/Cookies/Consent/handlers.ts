/**
 * Add event handlers to cookie consent modal and initialize visible setting in local storage
 */
import {
  getCookieConsentAllowBtn,
  getCookieConsentAllowLink,
  getCookieConsentCloseBtn,
  getCookieConsentCustomizeBtn,
  getCookieConsentCustomizeLink,
  getCookieConsentWrapper,
} from "./getters"

import {
  addButtonEventListeners,
  addLinkEventListeners,
  addWrapperEventListeners,
} from "@components/Scripts/elementListeners"

import {
  setCookieModalVisibility,
  initCookieModalVisibility,
} from "@lib/state/localStorage/consentModal"

import {
  initConsentCookies,
  allowAllConsentCookies
} from "@lib/state/cookies/consent"

import { showCookieCustomizeModal } from "@components/Cookies/Customize/handlers"

export const initCookieModal = () => {
  getCookieConsentWrapper().style.display = `block`
  getCookieConsentAllowBtn().focus()
  initCookieModalVisibility()
}

/** Close button and Escape key press event handler */
export const handleDismissCookieModal = () => {
  getCookieConsentWrapper().style.display = `none`
  setCookieModalVisibility(false)
}

export const handleWrapperDismissCookieModal = (event: Event) => {
  handleDismissCookieModal()
  event.stopPropagation() // sandbox Escape key press in the modal
}

/** `Allow All` button event handlers */
export const handleAllowAllCookies = () => {
  allowAllConsentCookies()
  handleDismissCookieModal()
}

/** `Customize Cookies` button event handlers */
export const handleCustomizeCookies = () => {
  showCookieCustomizeModal()
}

export const showCookieConsentModal = () => {
  /** Skip modal if user has already consented */
  if (!initConsentCookies()) return
  initCookieModal()
  /** Listener for 'Escape' keyup event when focus is in modal */
  addWrapperEventListeners(getCookieConsentWrapper(), handleWrapperDismissCookieModal)
  /** Listeners for 'click', 'Enter' keyup, and 'touchend' events */
  addButtonEventListeners(getCookieConsentCloseBtn(), handleDismissCookieModal)
  /** 'Allow All' button listeners */
  addButtonEventListeners(getCookieConsentAllowBtn(), handleAllowAllCookies)
  addLinkEventListeners(getCookieConsentAllowLink(), handleAllowAllCookies)
  /** 'Customize' button listeners */
  addButtonEventListeners(getCookieConsentCustomizeBtn(), handleCustomizeCookies)
  addLinkEventListeners(getCookieConsentCustomizeLink(), handleCustomizeCookies)
}
