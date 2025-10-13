import { createFocusTrap } from 'focus-trap'
import type { FocusTrap } from 'focus-trap'
import {
  getHeaderElement,
  getMobileSplashElement,
  getNavMenuElement,
  getNavToggleBtnElement,
  getNavToggleWrapperElement,
} from './selectors'

export const CLASSES = {
  navOpen: 'aria-expanded-true',
  noScroll: 'no-scroll',
  // active: `main-nav__item--active`,
}

export class Navigation {
  focusTrap: FocusTrap
  isMenuOpen: boolean
  /** <header> element with id '#header' */
  header: HTMLElement
  /** <div> element with id '#mobile-splash' */
  mobileSplash: HTMLDivElement
  /** <ul> element with class 'main-nav__menu' */
  menu: HTMLUListElement
  /** <span> element with class `#header__nav-icon` wrapping the toggle button */
  toggleWrapper: HTMLSpanElement
  /** <button> element with class 'nav-icon__toggle-btn' */
  toggleBtn: HTMLButtonElement
  togglePosition!: DOMRect

  constructor() {
    this.isMenuOpen = false
    /** Set references to menu elements */
    this.header = getHeaderElement()
    this.mobileSplash = getMobileSplashElement()
    this.menu = getNavMenuElement()
    this.toggleWrapper = getNavToggleWrapperElement()
    this.toggleBtn = getNavToggleBtnElement()
    this.setTogglePosition()
    /**
     * Set the focus trap on the menu <ul> so navigating past the last item wraps to the first.
     */
    this.focusTrap = createFocusTrap([this.toggleBtn, this.menu], {
      initialFocus: () => this.toggleBtn,
      /** Close the nav menu if the focus trap is exited by user pressing ESC */
      onDeactivate: () => this.toggleMenu(false),
    })
  }

  setTogglePosition = () => {
    // @TODO: There's a bug here. When the menu is expanded and the splash screen showing, and the device screen is resized, the bounding rectangle doesn't change.
    this.togglePosition = this.toggleBtn.getBoundingClientRect()
  }

  bindEvents() {
    this.toggleBtn.addEventListener('click', () => {
      this.toggleMenu()
    })
    // @TODO: Why is pressing enter triggering the click event, when type="button" is set?
    //this.toggleBtn.addEventListener('keyup', event => {
    //  if (event.key === 'Enter') this.toggleMenu()
    //})
    window.addEventListener('resize', this.setTogglePosition)
  }

  toggleMenu(force?: boolean) {
    /** Short-circuit if force paramater is the same as current state */
    if (this.isMenuOpen === force) return
    this.isMenuOpen = force !== undefined ? force : !this.isMenuOpen
    /**
     * The `#header__nav-icon` mobile nav menu hamburger icon is positioned with `right: 0`
     * and `align-items: center` in the `#header` flex container, but it will move down
     * when the `.main-nav__menu` unordered list has its `display` property changed from
     * `none` to `flex`. This is to fix the `#header__nav-icon` wrapper to an absolute
     * position when the menu list is expanded so it stays in the same position.
     */
    if (this.isMenuOpen) {
      this.toggleWrapper.style.left = `${this.togglePosition.left}px`
      this.toggleWrapper.style.top = `${this.togglePosition.top}px`
    } else {
      this.toggleWrapper.style.removeProperty('left')
      this.toggleWrapper.style.removeProperty('top')
    }
    /** <body class="no-scroll"> */
    document.body.classList.toggle(CLASSES.noScroll, this.isMenuOpen)
    /** <button class="nav-icon__toggle-btn" aria-expanded="false" ...> */
    this.toggleBtn.setAttribute('aria-expanded', String(this.isMenuOpen))
    /** <header id="header" class="header"> */
    this.header.classList.toggle(CLASSES.navOpen, this.isMenuOpen)

    if (this.isMenuOpen) {
      this.focusTrap.activate()
    } else {
      this.focusTrap.deactivate()
    }
  }
}

export const setupNavigation = (): void => {
  const navigation = new Navigation()
  navigation.bindEvents()
}
