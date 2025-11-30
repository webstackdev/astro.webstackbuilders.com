import { LitElement } from 'lit'
import { createFocusTrap } from 'focus-trap'
import type { FocusTrap } from 'focus-trap'
import { navigate } from 'astro:transitions/client'
import {
  getHeaderElement,
  getNavMenuElement,
  getNavToggleBtnElement,
  getMobileNavFocusContainer,
} from '@components/Navigation/client/selectors'
import { isAnchorElement } from '@components/scripts/assertions/elements'
import { addScriptBreadcrumb, ClientScriptError } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { addButtonEventListeners, addLinkEventListeners } from '@components/scripts/elementListeners'
import { defineCustomElement } from '@components/scripts/utils'
import { setOverlayPauseState } from '@components/scripts/store'
import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'

const SCRIPT_NAME = 'NavigationElement'

export const CLASSES = {
  navOpen: 'aria-expanded-true',
  noScroll: 'no-scroll',
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
  private initialized = false

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
    } catch (error) {
      throw new ClientScriptError(
        `NavigationElement: Failed to find required DOM elements - ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }

    this.setupFocusTrap()
    this.bindEvents()
    this.initialized = true
    this.setAttribute('data-nav-ready', 'true')
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
        `NavigationElement: Failed to create focus trap - ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      const navLinks = this.menu.querySelectorAll('a[href]')

      navLinks.forEach((link) => {
        if (!isAnchorElement(link)) return

        try {
          addLinkEventListeners(link, (event) => {
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
    this.toggleBtn.setAttribute('aria-expanded', String(this.isMenuOpen))
    this.header.classList.toggle(CLASSES.navOpen, this.isMenuOpen)

    if (this.isMenuOpen) {
      this.focusTrap?.activate()
      setTimeout(() => {
        this.menu.classList.add('menu-visible')
      }, 550)
    } else {
      this.focusTrap?.deactivate()
      this.menu.classList.remove('menu-visible')
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
