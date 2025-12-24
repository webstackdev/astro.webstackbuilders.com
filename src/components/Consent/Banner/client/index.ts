/**
 * Consent Banner Web Component
 * Manages the consent modal display and user interactions across View Transitions
 * Uses Light DOM (no Shadow DOM) with Astro-rendered templates
 */

import type { WebComponentModule } from '@components/scripts/@types/webComponentModule'
import {
  addButtonEventListeners,
  addLinkEventListeners,
  addWrapperEventListeners,
} from '@components/scripts/elementListeners'
import {
  allowAllConsentCookies,
  getConsentBannerVisibility,
  hideConsentBanner,
  initConsentCookies,
  showConsentBanner,
} from '@components/scripts/store'
import {
  getConsentAllowBtn,
  getConsentCloseBtn,
  getConsentCustomizeLink,
  getConsentWrapper,
} from '@components/Consent/Banner/client/selectors'
import { addScriptBreadcrumb } from '@components/scripts/errors'
import { handleScriptError } from '@components/scripts/errors/handler'
import { defineCustomElement } from '@components/scripts/utils'

const COMPONENT_TAG_NAME = 'consent-banner' as const
const COMPONENT_SCRIPT_NAME = 'ConsentBannerElement'
export const CONSENT_BANNER_READY_EVENT = 'consent-banner:ready'

export class ConsentBannerElement extends HTMLElement {
  private wrapper!: HTMLDivElement
  private closeBtn!: HTMLButtonElement
  private allowBtn!: HTMLButtonElement
  private customizeLink!: HTMLAnchorElement
  private trapFocusHandler: (((_event: Event) => void) | null) = null
  private domReadyHandler: (() => void) | null = null
  private beforeSwapHandler: (() => void) | null = null
  private afterSwapHandler: (() => void) | null = null
  public isInitialized = false
  private static isModalCurrentlyVisible = false
  public static navigateToUrl(url: string): void {
    if (typeof window === 'undefined') {
      return
    }

    window.location.assign(url)
  }

  connectedCallback(): void {
    if (this.isInitialized || typeof document === 'undefined') {
      return
    }

    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'connectedCallback' }
    addScriptBreadcrumb(context)

    try {
      if (document.readyState === 'loading') {
        this.domReadyHandler = () => {
          document.removeEventListener('DOMContentLoaded', this.domReadyHandler as EventListener)
          this.domReadyHandler = null
          this.initialize()
        }
        document.addEventListener('DOMContentLoaded', this.domReadyHandler)
        return
      }

      this.initialize()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  disconnectedCallback(): void {
    if (this.domReadyHandler) {
      document.removeEventListener('DOMContentLoaded', this.domReadyHandler)
      this.domReadyHandler = null
    }

    this.removeViewTransitionsHandlers()
    this.removeFocusTrap()
    this.isInitialized = false
  }

  private initialize(): void {
    if (this.isInitialized) {
      return
    }

    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'initialize' }
    addScriptBreadcrumb(context)

    try {
      this.findElements()
      this.setViewTransitionsHandlers()
      this.showModal()
      this.isInitialized = true
      this.dispatchReadyEvent()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private dispatchReadyEvent(): void {
    this.dispatchEvent(new CustomEvent(CONSENT_BANNER_READY_EVENT))
  }

  private findElements(): void {
    this.wrapper = getConsentWrapper()
    this.closeBtn = getConsentCloseBtn()
    this.allowBtn = getConsentAllowBtn()
    this.customizeLink = getConsentCustomizeLink()
  }

  private setViewTransitionsHandlers(): void {
    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'setViewTransitionsHandlers' }
    addScriptBreadcrumb(context)

    try {
      this.beforeSwapHandler = () => {
        if (!this.wrapper) return

        const isVisible = this.wrapper.style.display === 'block' || this.wrapper.style.display === 'flex'
        if (isVisible) {
          ConsentBannerElement.isModalCurrentlyVisible = true
          showConsentBanner()
          return
        }

        ConsentBannerElement.isModalCurrentlyVisible = false
        hideConsentBanner()
      }

      this.afterSwapHandler = () => {
        /* Placeholder for restoring state after View Transitions */
      }

      document.addEventListener('astro:before-swap', this.beforeSwapHandler)
      document.addEventListener('astro:after-swap', this.afterSwapHandler)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private removeViewTransitionsHandlers(): void {
    if (this.beforeSwapHandler) {
      document.removeEventListener('astro:before-swap', this.beforeSwapHandler)
      this.beforeSwapHandler = null
    }

    if (this.afterSwapHandler) {
      document.removeEventListener('astro:after-swap', this.afterSwapHandler)
      this.afterSwapHandler = null
    }
  }

  private initModal(): void {
    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'initModal' }
    addScriptBreadcrumb(context)

    try {
      this.wrapper.style.display = 'block'
      this.setupFocusTrap()
      this.wrapper.focus()
      setTimeout(() => {
        if (this.wrapper.style.display === 'none') {
          return
        }

        this.allowBtn.focus()
      }, 0)
      showConsentBanner()
      ConsentBannerElement.isModalCurrentlyVisible = true
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private handleDismissModal = (): void => {
    console.log('🍪 Modal dismissed by user')

    this.removeFocusTrap()

    this.wrapper.style.display = 'none'
    hideConsentBanner()
    ConsentBannerElement.isModalCurrentlyVisible = false
  }

  private handleWrapperDismissModal = (event: Event): void => {
    this.handleDismissModal()
    event.stopPropagation()
  }

  private handleAllowAllCookies = (): void => {
    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'allowAllCookies' }
    addScriptBreadcrumb(context)

    try {
      console.log('🍪 User accepted all cookies')
      allowAllConsentCookies()

      this.removeFocusTrap()

      this.wrapper.style.display = 'none'
      hideConsentBanner()
      ConsentBannerElement.isModalCurrentlyVisible = false
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private handleCustomizeCookies = (event?: Event): void => {
    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'customizeCookies' }
    addScriptBreadcrumb(context)

    try {
      event?.preventDefault()
      this.navigateToConsentPage()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private navigateToConsentPage(): void {
    if (typeof window === 'undefined') {
      return
    }

    this.handleDismissModal()

    const targetUrl = new URL('/consent', window.location.origin)
    ConsentBannerElement.navigateToUrl(targetUrl.toString())
  }

  private bindEvents(): void {
    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'bindEvents' }
    addScriptBreadcrumb(context)

    try {
      addWrapperEventListeners(this.wrapper, this.handleWrapperDismissModal)
      addButtonEventListeners(this.closeBtn, this.handleDismissModal)
      addButtonEventListeners(this.allowBtn, this.handleAllowAllCookies)
      addLinkEventListeners(this.customizeLink, this.handleCustomizeCookies)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private showModal(): void {
    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'showModal' }
    addScriptBreadcrumb(context)

    try {
      const wasVisible = this.wrapper.style.display === 'block' || this.wrapper.style.display === 'flex'
      const shouldBeVisible = wasVisible ||
        ConsentBannerElement.isModalCurrentlyVisible ||
        getConsentBannerVisibility()
      const cookiesInitialized = initConsentCookies()

      if (this.isConsentRoute()) {
        console.log('🍪 Suppressing consent modal on consent settings page')
        this.suppressModalForConsentPage()
        return
      }

      if (shouldBeVisible) {
        console.log('🍪 Restoring modal from previous navigation')
        this.initModal()
        this.bindEvents()
        return
      }

      if (!cookiesInitialized) {
        console.log('🍪 User already consented, skipping modal')
        return
      }

      console.log('🍪 Showing modal for first time')
      this.initModal()
      this.bindEvents()
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private isConsentRoute(): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    const pathname = window.location.pathname
    return pathname === '/consent' || pathname.startsWith('/consent/')
  }

  private suppressModalForConsentPage(): void {
    this.removeFocusTrap()
    this.wrapper.style.display = 'none'
    hideConsentBanner()
    ConsentBannerElement.isModalCurrentlyVisible = false
  }

  private setupFocusTrap(): void {
    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'setupFocusTrap' }
    addScriptBreadcrumb(context)

    try {
      const focusableElements = this.wrapper.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElements.length === 0) return

      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]

      if (!(firstFocusable instanceof HTMLElement) || !(lastFocusable instanceof HTMLElement)) return

      this.trapFocusHandler = (event: Event) => {
        const keyEvent = event as KeyboardEvent
        if (keyEvent.key !== 'Tab') {
          return
        }

        if (!(event.target instanceof Node) || !this.wrapper.contains(event.target)) {
          return
        }

        if (keyEvent.shiftKey) {
          if (document.activeElement === firstFocusable) {
            keyEvent.preventDefault()
            lastFocusable.focus()
          }
        } else if (document.activeElement === lastFocusable) {
          keyEvent.preventDefault()
          firstFocusable.focus()
        }
      }

  document.addEventListener('keydown', this.trapFocusHandler)
    } catch (error) {
      handleScriptError(error, context)
    }
  }

  private removeFocusTrap(): void {
    const context = { scriptName: COMPONENT_SCRIPT_NAME, operation: 'removeFocusTrap' }
    addScriptBreadcrumb(context)

    try {
      if (this.trapFocusHandler) {
        document.removeEventListener('keydown', this.trapFocusHandler)
        this.trapFocusHandler = null
      }
    } catch (error) {
      handleScriptError(error, context)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'consent-banner': ConsentBannerElement
  }
}

export const registerConsentBannerWebComponent = (tagName: string = COMPONENT_TAG_NAME) => {
  if (typeof window === 'undefined') return
  defineCustomElement(tagName, ConsentBannerElement)
}

export const webComponentModule: WebComponentModule<ConsentBannerElement> = {
  registeredName: COMPONENT_TAG_NAME,
  componentCtor: ConsentBannerElement,
  registerWebComponent: registerConsentBannerWebComponent,
}
