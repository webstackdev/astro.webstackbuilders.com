import { LitElement } from 'lit'
import { createFocusTrap } from 'focus-trap'
import type { FocusTrap } from 'focus-trap'
import { navigate } from 'astro:transitions/client'
import {
  getHeaderElement,
  getNavMenuElement,
  getNavToggleBtnElement,
  getMobileNavFocusContainer,
  getMobileSplashBackdropElement,
  queryNavLinks,
} from '@components/Navigation/client/selectors'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import {
  addButtonEventListeners,
  addLinkEventListeners,
} from '@components/scripts/elementListeners'
import { defineCustomElement } from '@components/scripts/utils'
import { setOverlayPauseState } from '@components/scripts/store'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

const SCRIPT_NAME = 'NavigationElement'

const MENU_TOGGLE_LABELS = {
  open: 'Open main menu',
  close: 'Close main menu',
}

export const CLASSES = {
  noScroll: 'no-scroll',
  ariaExpandedTrue: 'aria-expanded-true',
}

export const ATTRIBUTES = {
  navOpen: 'data-nav-open',
}

export class NavigationElement extends LitElement {
  static registeredName = 'site-navigation'

  protected override createRenderRoot() {
    return this
  }

  protected override render() {
    return null
  }

  private focusTrap?: FocusTrap
  private isMenuOpen = false
  private header!: HTMLElement
  private menu!: HTMLUListElement
  private toggleBtn!: HTMLButtonElement
  private focusContainer!: HTMLDivElement
  private splashBackdrop!: HTMLDivElement
  private initialized = false
  private menuRevealSequence = 0
  private splashTransitionEndHandler: ((_event: Event) => void) | undefined
  private splashFallbackTimeoutId: number | undefined

  override connectedCallback(): void {
    super.connectedCallback()
    if (this.initialized) return
    this.initialize()
  }

  private initialize(): void {
    this.isMenuOpen = false

    try {
      this.header = getHeaderElement()
      this.menu = getNavMenuElement()
      this.toggleBtn = getNavToggleBtnElement()
      this.focusContainer = getMobileNavFocusContainer()
      this.splashBackdrop = getMobileSplashBackdropElement()
    } catch (error) {
      throw new ClientScriptError(
        `NavigationElement: Failed to find required DOM elements - ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    this.setupFocusTrap()
    this.bindEvents()
    this.toggleBtn.setAttribute('aria-label', MENU_TOGGLE_LABELS.open)
    this.initialized = true
    this.setAttribute('data-nav-ready', 'true')
  }

  private prefersReducedMotion(): boolean {
    if (typeof window.matchMedia !== 'function') {
      return false
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  private clearMenuRevealWaiters(): void {
    if (this.splashTransitionEndHandler) {
      this.splashBackdrop.removeEventListener('transitionend', this.splashTransitionEndHandler)
      this.splashTransitionEndHandler = undefined
    }

    if (this.splashFallbackTimeoutId !== undefined) {
      window.clearTimeout(this.splashFallbackTimeoutId)
      this.splashFallbackTimeoutId = undefined
    }
  }

  /**
   * Reveal the menu items as soon as the mobile splash has finished expanding.
   * This replaces a fixed delay so fast devices don't feel artificially slow.
   */
  private revealMenuWhenSplashCompletes(): void {
    this.clearMenuRevealWaiters()

    const revealSequence = ++this.menuRevealSequence

    const reveal = () => {
      if (!this.isMenuOpen) return
      if (revealSequence !== this.menuRevealSequence) return
      this.menu.classList.add('menu-visible')
      this.clearMenuRevealWaiters()
    }

    if (this.prefersReducedMotion()) {
      reveal()
      return
    }

    this.splashTransitionEndHandler = (event: Event) => {
      if (event.target !== this.splashBackdrop) return
      const propertyName = (event as TransitionEvent).propertyName
      if (propertyName && propertyName !== 'transform') return
      reveal()
    }

    this.splashBackdrop.addEventListener('transitionend', this.splashTransitionEndHandler)
    this.splashFallbackTimeoutId = window.setTimeout(reveal, 700)
  }

  private setupFocusTrap(): void {
    try {
      this.focusTrap = createFocusTrap(this.focusContainer, {
        initialFocus: () => this.toggleBtn,
        // Allow backdrop taps without collapsing the menu
        allowOutsideClick: true,
        clickOutsideDeactivates: false,
        onDeactivate: () => this.toggleMenu(false),
      })
    } catch (error) {
      throw new ClientScriptError(
        `NavigationElement: Failed to create focus trap - ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private bindEvents(): void {
    addButtonEventListeners(this.toggleBtn, () => {
      this.toggleMenu()
    })

    document.addEventListener('keyup', this.handleDocumentKeyup)
    document.addEventListener('pointerdown', this.handleDocumentPointerDown, { capture: true })

    this.setupViewTransitions()
  }

  private handleDocumentKeyup = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.isMenuOpen) {
      this.toggleMenu(false)
    }
  }

  private handleDocumentPointerDown = (event: PointerEvent) => {
    if (!this.isMenuOpen) return
    const target = event.target
    if (!(target instanceof Node)) return
    if (this.header.contains(target)) return

    event.preventDefault()
    event.stopPropagation()
  }

  private setupViewTransitions(): void {
    const context = { scriptName: SCRIPT_NAME, operation: 'setupViewTransitions' }
    addScriptBreadcrumb(context)

    try {
      const navLinks = queryNavLinks(this.menu)

      navLinks.forEach(link => {
        try {
          addLinkEventListeners(link, event => {
            event.preventDefault()
            const href = link.getAttribute('href')

            if (!href) return

            if (this.isMenuOpen) {
              this.toggleMenu(false)
            }

            navigate(href)
          })
        } catch (error) {
          handleScriptError(error, {
            scriptName: SCRIPT_NAME,
            operation: 'setupNavigationLink',
          })
        }
      })
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  toggleMenu(force?: boolean): void {
    if (this.isMenuOpen === force) return
    this.isMenuOpen = force !== undefined ? force : !this.isMenuOpen

    if (this.isMenuOpen) {
      setOverlayPauseState('navigation', true)
    } else {
      setOverlayPauseState('navigation', false)
    }

    document.body.classList.toggle(CLASSES.noScroll, this.isMenuOpen)
    this.header.classList.toggle(CLASSES.ariaExpandedTrue, this.isMenuOpen)
    this.toggleBtn.setAttribute('aria-expanded', String(this.isMenuOpen))
    this.toggleBtn.setAttribute(
      'aria-label',
      this.isMenuOpen ? MENU_TOGGLE_LABELS.close : MENU_TOGGLE_LABELS.open
    )
    this.toggleAttribute(ATTRIBUTES.navOpen, this.isMenuOpen)

    if (this.isMenuOpen) {
      this.focusTrap?.activate()
      this.menu.classList.remove('menu-visible')
      this.revealMenuWhenSplashCompletes()
    } else {
      this.focusTrap?.deactivate()
      this.menu.classList.remove('menu-visible')
      this.clearMenuRevealWaiters()
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'site-navigation': NavigationElement
  }
}

export const registerNavigationElement = (tagName = NavigationElement.registeredName) => {
  if (typeof window === 'undefined') {
    return
  }

  defineCustomElement(tagName, NavigationElement)
}

export const webComponentModule: WebComponentModule<NavigationElement> = {
  registeredName: NavigationElement.registeredName,
  componentCtor: NavigationElement,
  registerWebComponent: registerNavigationElement,
}
