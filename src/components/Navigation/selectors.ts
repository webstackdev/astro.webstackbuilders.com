/**
 * Type-safe HTML element selectors
 */
import {
  isButtonElement,
  isDivElement,
  isHeaderElement,
  isSpanElement,
  isUlElement,
} from '@lib/utils/assertions/elements'

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
}

/**
 * Getter for the header <span> HTML element that wraps the menu
 */
export const getHeaderElement = (): HTMLElement => {
  const header = document.querySelector(SELECTORS.header)
  if (!isHeaderElement(header)) {
    throw new Error(`Site main <header> is missing in document, selector: ${SELECTORS.header}`)
  }
  return header
}

/**
 * Getter for the header <span> HTML element that wraps the menu
 */
export const getMobileSplashElement = (): HTMLDivElement => {
  const splash = document.querySelector(SELECTORS.splash)
  if (!isDivElement(splash)) {
    throw new Error(
      `Mobile nav splash <div> is missing in document, selector: ${SELECTORS.splash}`
    )
  }
  return splash
}

/**
 * Getter for the header <span> HTML element that wraps the menu
 */
export const getNavWrapperElement = (): HTMLSpanElement => {
  const navWrapper = document.querySelector(SELECTORS.navWrapper)
  if (!isSpanElement(navWrapper)) {
    throw new Error(
      `Main nav menu <span> wrapper is missing in document, selector: ${SELECTORS.navWrapper}`
    )
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
    throw new Error(`<ul> element is missing under <nav> element in document, class: ${SELECTORS.nav}`)
  }
  return menu
}

/**
 * Getter for a <span> HTML element by class in the header
 */
export const getNavToggleWrapperElement = (): HTMLSpanElement => {
  const toggleWrapper = document.querySelector(SELECTORS.toggleWrapper)
  if (!isSpanElement(toggleWrapper)) {
    throw new Error(`<span> element with class ${SELECTORS.toggleWrapper} is missing in document`)
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
    throw new Error(`<button> element with class ${SELECTORS.toggleBtn} is missing in document`)
  }
  return toggleBtn
}
