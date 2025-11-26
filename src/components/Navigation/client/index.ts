import { createFocusTrap } from 'focus-trap'
import type { FocusTrap } from 'focus-trap'
import { navigate } from 'astro:transitions/client'
import {
  getHeaderElement,
  getMobileSplashElement,
  getNavMenuElement,
  getNavToggleBtnElement,
  getNavToggleWrapperElement,
  getMobileNavFocusContainer,
} from '@components/Navigation/client/selectors'
import { isAnchorElement } from '@components/scripts/assertions/elements'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { dispatchAnimationEvent, AnimationLifecycleEvent } from '@components/scripts/events'
import { addButtonEventListeners, addLinkEventListeners } from '@components/scripts/elementListeners'

export const CLASSES = {
  navOpen: 'aria-expanded-true',
  noScroll: 'no-scroll',
  // active: `main-nav__item--active`,
}

/**
 * Navigation component with instance-specific approach
 * Uses Astro View Transitions for navigation
 */
export class Navigation {
  static scriptName = 'Navigation'

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
  /** <div> element with id '#mobile-nav-focus-container' for focus trap */
  focusContainer: HTMLDivElement
  togglePosition!: DOMRect

  constructor() {
    this.isMenuOpen = false

    try {
      /** Set references to menu elements */
      this.header = getHeaderElement()
      this.mobileSplash = getMobileSplashElement()
      this.menu = getNavMenuElement()
      this.toggleWrapper = getNavToggleWrapperElement()
      this.toggleBtn = getNavToggleBtnElement()
      this.focusContainer = getMobileNavFocusContainer()
    } catch (error) {
      throw new ClientScriptError(
        `Navigation: Failed to find required DOM elements - ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    try {
      this.setTogglePosition()
    } catch (error) {
      // Non-critical: positioning can fail but navigation still works
      const context = { scriptName: Navigation.scriptName, operation: 'setTogglePosition' }
      handleScriptError(error, context)
    }

    try {
      /**
       * Set the focus trap on the focus container which contains both the toggle button and menu.
       * This ensures proper tab order between the toggle button and navigation links.
       */
      this.focusTrap = createFocusTrap(this.focusContainer, {
        initialFocus: () => this.toggleBtn,
        /** Close the nav menu if the focus trap is exited by user pressing ESC */
        onDeactivate: () => this.toggleMenu(false),
      })
    } catch (error) {
      throw new ClientScriptError(
        `Navigation: Failed to create focus trap - ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  setTogglePosition = () => {
    const context = { scriptName: Navigation.scriptName, operation: 'setTogglePosition' }

    try {
      // @TODO: There's a bug here. When the menu is expanded and the splash screen showing, and the device screen is resized, the bounding rectangle doesn't change.
      this.togglePosition = this.toggleBtn.getBoundingClientRect()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  bindEvents() {
    addButtonEventListeners(this.toggleBtn, () => {
      this.toggleMenu()
    })
    // @TODO: Why is pressing enter triggering the click event, when type="button" is set?
    //this.toggleBtn.addEventListener('keyup', event => {
    //  if (event.key === 'Enter') this.toggleMenu()
    //})

    // Handle Escape key to close menu
    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape' && this.isMenuOpen) {
        this.toggleMenu(false)
      }
    })

    window.addEventListener('resize', this.setTogglePosition)

    // Set up View Transitions navigation for all nav links
    this.setupViewTransitions()
  }

  /**
   * Set up View Transitions navigation using Astro's navigate API
   */
  setupViewTransitions() {
    const context = { scriptName: Navigation.scriptName, operation: 'setupViewTransitions' }
    addScriptBreadcrumb(context)

    try {
      const navLinks = this.menu.querySelectorAll('a[href]')

      navLinks.forEach(link => {
        if (!isAnchorElement(link)) return

        try {
          addLinkEventListeners(link, (event) => {
            event.preventDefault()
            const href = link.getAttribute('href')

            if (href) {
              // Close mobile menu if it's open before navigating
              if (this.isMenuOpen) {
                this.toggleMenu(false)
              }

              // Use Astro's View Transitions navigation
              navigate(href)
            }
          })
        } catch (error) {
          // Individual link failure shouldn't break all navigation
          handleScriptError(error, {
            scriptName: Navigation.scriptName,
            operation: 'setupNavigationLink'
          })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  toggleMenu(force?: boolean) {
    /** Short-circuit if force paramater is the same as current state */
    if (this.isMenuOpen === force) return
    this.isMenuOpen = force !== undefined ? force : !this.isMenuOpen

    // Dispatch events to pause/resume background animations
    if (this.isMenuOpen) {
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_OPENED, { source: 'navigation' })
    } else {
      dispatchAnimationEvent(AnimationLifecycleEvent.OVERLAY_CLOSED, { source: 'navigation' })
    }

    /**
     * The toggle button is already positioned with `position: fixed` and `right`,
     * so we don't need to adjust its position when the menu opens.
     */
    /** <body class="no-scroll"> */
    document.body.classList.toggle(CLASSES.noScroll, this.isMenuOpen)
    /** <button class="nav-icon__toggle-btn" aria-expanded="false" ...> */
    this.toggleBtn.setAttribute('aria-expanded', String(this.isMenuOpen))
    /** <header id="header" class="header"> */
    this.header.classList.toggle(CLASSES.navOpen, this.isMenuOpen)

    if (this.isMenuOpen) {
      this.focusTrap.activate()
      // Add menu-visible class after splash animation completes (550ms)
      const menu = getNavMenuElement()
      setTimeout(() => {
        menu.classList.add('menu-visible')
      }, 550)
    } else {
      this.focusTrap.deactivate()
      // Remove menu-visible class immediately when closing
      const menu = getNavMenuElement()
      menu.classList.remove('menu-visible')
    }
  }

  /**
   * Static initialization method
   */
  static init(): void {
    const navigation = new Navigation()
    navigation.bindEvents()
  }

  static pause(): void {
    // Navigation doesn't need pause functionality during visibility changes
  }

  static resume(): void {
    // Navigation doesn't need resume functionality during visibility changes
  }

  static reset(): void {
    // Clean up any global state if needed for View Transitions
    // Remove any event listeners or reset focus traps if necessary
  }
}
