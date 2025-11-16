/**
 * Type-safe HTML element selectors
 */
import { ClientScriptError } from '@components/scripts/errors/ClientScriptError'
import {
  isButtonElement,
  isDivElement,
  isHeaderElement,
  isSpanElement,
  isUlElement,
} from '@components/scripts/assertions/elements'

export const SELECTORS = {
  /** Site main <header> */
  header: '#header',
  /** Menu <span> wrapper */
  navWrapper: '#header__main-nav',
  /** <nav> element wrapping the main menu list */
  nav: '.main-nav',
  /** <ul> element */
  menu: '.main-nav-menu',
  /** Mobile menu toggle button <span> wrapper */
  toggleWrapper: '#header__nav-icon',
  /** Mobile menu toggle <button> */
  toggleBtn: '.nav-toggle-btn',
  /** Mobile splash <div> */
  splash: '#mobile-splash',
  /** Focus trap container for mobile navigation */
  focusContainer: '#mobile-nav-focus-container',
}

/**
 * Getter for the header <header> HTML element
 */
export const getHeaderElement = (): HTMLElement => {
  const header = document.querySelector(SELECTORS.header)
  if (!isHeaderElement(header)) {
    throw new ClientScriptError({
      message: `Site main <header> is missing in document, selector: ${SELECTORS.header}`
    })
  }
  return header
}

/**
 * Getter for the mobile splash <div> HTML element
 */
export const getMobileSplashElement = (): HTMLDivElement => {
  const splash = document.querySelector(SELECTORS.splash)
  if (!isDivElement(splash)) {
    throw new ClientScriptError({
      message: `Mobile nav splash <div> is missing in document, selector: ${SELECTORS.splash}`
    })
  }
  return splash
}

/**
 * Getter for the nav wrapper <span> HTML element that wraps the menu
 */
export const getNavWrapperElement = (): HTMLSpanElement => {
  const navWrapper = document.querySelector(SELECTORS.navWrapper)
  if (!isSpanElement(navWrapper)) {
    throw new ClientScriptError({
      message: `Main nav menu <span> wrapper is missing in document, selector: ${SELECTORS.navWrapper}`
    })
  }
  return navWrapper
}

/**
 * Getter for a <ul> HTML element by class nested inside a provided <nav> element
 */
export const getNavMenuElement = (): HTMLUListElement => {
  const navWrapper = getNavWrapperElement()
  const menu = navWrapper.querySelector(SELECTORS.menu)
  if (!isUlElement(menu)) {
    throw new ClientScriptError({
      message: `<ul> element is missing under <nav> element in document, class: ${SELECTORS.menu}`
    })
  }
  return menu
}

/**
 * Getter for a <span> HTML element by class in the header
 */
export const getNavToggleWrapperElement = (): HTMLSpanElement => {
  const toggleWrapper = document.querySelector(SELECTORS.toggleWrapper)
  if (!isSpanElement(toggleWrapper)) {
    throw new ClientScriptError({
      message: `<span> element with class ${SELECTORS.toggleWrapper} is missing in document`
    })
  }
  return toggleWrapper
}

/**
 * Getter for the <button> nav menu toggle HTML element by class in the header
 */
export const getNavToggleBtnElement = (): HTMLButtonElement => {
  const toggleWrapper = getNavToggleWrapperElement()
  const toggleBtn = toggleWrapper.querySelector(SELECTORS.toggleBtn)
  if (!isButtonElement(toggleBtn)) {
    throw new ClientScriptError({
      message: `<button> element with class ${SELECTORS.toggleBtn} is missing in document`
    })
  }
  return toggleBtn
}

/**
 * Getter for the mobile navigation focus container <div> HTML element
 */
export const getMobileNavFocusContainer = (): HTMLDivElement => {
  const focusContainer = document.querySelector(SELECTORS.focusContainer)
  if (!isDivElement(focusContainer)) {
    throw new ClientScriptError({
      message: `<div> element with id ${SELECTORS.focusContainer} is missing in document`
    })
  }
  return focusContainer
}
